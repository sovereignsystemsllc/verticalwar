import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers to allow our V4 frontend to talk to this Edge Function
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Only accept POST requests with JSON payloads
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { imageUrl, fileName } = await req.json();

        if (!imageUrl || !fileName) {
            return new Response(JSON.stringify({ error: 'Missing required parameters: imageUrl or fileName' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`Starting proxy download for: ${imageUrl}`);

        // 1. Fetch the image from the external CDN (Substack) Server-to-Server
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
            console.error(`External fetch failed with status: ${imageResponse.status}`);
            return new Response(JSON.stringify({ error: `Failed to fetch external image: HTTP ${imageResponse.status}` }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

        // 2. Initialize Supabase Admin Client to bypass RLS for internal logic
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log(`Uploading ${fileName} to article_assets bucket...`);

        // 3. Upload the fetched buffer to our Sovereign Storage Bucket
        const { error: uploadError } = await supabaseAdmin.storage
            .from('article_assets')
            .upload(fileName, imageBuffer, {
                contentType: contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return new Response(JSON.stringify({ error: uploadError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4. Generate the new secure public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from('article_assets')
            .getPublicUrl(fileName);

        // 5. Return the clean URL to the frontend
        return new Response(JSON.stringify({
            success: true,
            publicUrl: publicUrlData.publicUrl
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Unhandled Exception:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
