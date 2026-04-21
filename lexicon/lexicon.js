// lexicon.js — V4 Sovereign Lexicon Data & Logic
// Rebuilt from V3 (68 terms) → V4 (51 curated, expanded terms)
// All definitions expanded using the full 180-article corpus.

const DB = {

    // ═══════════════════════════════════════════════════
    // CATEGORY: THE ENEMY ARCHITECTURE
    // ═══════════════════════════════════════════════════

    'THE_RUST': {
        title: 'THE RUST',
        type: 'ENTITY',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/Graphic_The_Rust_Tower_Banks_Media_Goon_Squad.png',
        def: `The parasitic, non-sentient system of elite control. It is not a person, a party, or a single corporation &mdash; it is <em>entropy weaponized</em>. It functions through a symbiotic fusion with State Power (The Crown) to enforce Managed Decline across every system it touches: housing, healthcare, media, food, water, and money.<br><br>The Rust does not build. It cannot create. It can only <em>corrode</em> the structures the Gears built, extract the accumulated value, and channel it upward through regulatory capture, tax policy, and manufactured crises. It is the mechanism behind why wages stagnate as asset prices soar, why the law punishes poverty and rewards fraud, and why every election produces the same economic outcome for the productive class.<br><br><strong>THE ALLEGORY:</strong> For the complete myth-mapping of this system, see Rika's <em>Living Storybook (Parts 1 &amp; 1.5)</em>. The Rust is the Hinamizawa Syndrome played at a civilizational scale.`,
        links: [
            { text: 'JPMORGAN: UNINDICTED', url: 'https://constructamiracle.com/p/jpmorgan-chase-the-unindicted-co' },
            { text: 'KING JAMIE\'S PLAN', url: 'https://constructamiracle.com/p/king-jamie-dimons-plan-to-steal-our' },
            { text: 'IMPUNITY DOCTRINE', url: 'https://constructamiracle.com/p/why-wall-street-ceos-never-go-to' },
            { text: 'A CENTURY OLD OPERATION', url: 'https://constructamiracle.com/p/a-century-old-nazi-operation-became' }
        ]
    },

    'THE_GEARS': {
        title: 'THE GEARS',
        type: 'ENTITY',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/Graphic_Social_Gears_Collage_Tan.png',
        def: `The productive majority &mdash; Labor, Creators, Farmers, Small Business Owners, Caregivers &mdash; who generate 100% of civilization's real value. The Gears are not a class in the traditional Marxist sense; they are defined not by income but by function. If you produce something tangible &mdash; a meal, a building, a piece of code, a child who will outlive you &mdash; you are a Gear.<br><br>To The Rust, the Gears are "Fuel." They are kept productive through Economic Terror (Layer 1), divided through The Great Distraction (Layer 2), and pacified through Learned Helplessness (Layer 3). The entire architecture of the Three-Layered Prison exists for one purpose: to prevent the Gears from recognizing their collective power.<br><br>The outcome of the Vertical War depends entirely on whether they remain isolated victims or recognize their leverage and become the Phalanx.`
    },

    'VERTICAL_WAR': {
        title: 'VERTICAL WAR',
        type: 'DOCTRINE',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/Vertical%20War.webp',
        def: `The true conflict of the 21st century, and the organizing thesis of this entire operation. It is not Left vs. Right (that is the Horizontal War, a simulation). It is <strong>Up vs. Down</strong> &mdash; the productive class against the parasitic class, the Gears against the Rust.<br><br>The Vertical War has been ongoing for decades, but it is deliberately obscured. While the Horizontal War fills every screen with culture battles, the Vertical War operates beneath the noise: assets are stripped from the many and transferred to the few, regardless of which party wins the election. Wages stagnate. Housing becomes unavailable. Healthcare becomes a luxury. The wealth gap compounds. These are not accidents or policy failures &mdash; they are the <em>intended outputs</em> of the system.<br><br>Recognizing the Vertical War is the first act of sovereignty. Once you see the axis of the conflict, the Horizontal War collapses into theater. You stop fighting your neighbor and start locating the hand that built the cage.`,
        links: [
            { text: 'THE ILLUSION INDEX', url: 'https://constructamiracle.com/p/the-illusion-index' },
            { text: 'FUCK THE CULTURE WAR', url: 'https://constructamiracle.com/p/fuck-the-culture-war' }
        ]
    },

    'HORIZONTAL_WAR': {
        title: 'HORIZONTAL WAR',
        type: 'SIMULATION',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/horizontal%20war.jpg',
        def: `The distracting theater of partisan politics (Red vs. Blue, Left vs. Right, Liberal vs. Conservative). It is not organic conflict &mdash; it is engineered. The Rust requires the Gears to look <em>sideways</em> at each other instead of <em>upward</em> at the extractors. The Horizontal War provides that service.<br><br>It operates inside the Puppet Colosseum, channeling righteous, justified anger into balanced tribal conflict that threatens nothing and changes nothing structural. The teams rotate. The policies shift at the margins. But the Financial Nexus remains intact, the asset transfer continues, and the wealth gap widens regardless of which color jersey wins.<br><br>The tell-tale sign you are inside the Horizontal War: you are furious at your neighbor, your coworker, or someone on the other side of the country &mdash; and completely untroubled by the people who set your wage, own your landlord, and wrote the tax code.`
    },

    'THREE_LAYERED_PRISON': {
        title: 'THREE-LAYERED PRISON',
        type: 'SYSTEM',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/3layerprison.png',
        def: `The total, integrated architecture of control that keeps the Gears trapped, exhausted, divided, and despairing. It is not a conspiracy hatched in a single meeting room &mdash; it is a <em>mechanism</em>, the emergent output of thousands of aligned incentives that all benefit the same class at the expense of the same class.<br><br><strong>LAYER 1 &mdash; ECONOMIC TERROR:</strong> The baseline state of precarity. Rent, debt, stagnant wages, "poor taxes," and manufactured inflation keep the population too exhausted and financially terrified to resist. Dissent is a luxury you cannot afford when you are one missed shift from eviction.<br><br><strong>LAYER 2 &mdash; THE GREAT DISTRACTION:</strong> The Puppet Colosseum of horizontal politics. Righteous anger is channeled sideways into culture war spectacles that cycle endlessly but change nothing structural. You fight your neighbor instead of your landlord.<br><br><strong>LAYER 3 &mdash; LEARNED HELPLESSNESS:</strong> The psychological endgame. The cultivated belief that the system is too large, too complex, and too entrenched to challenge. It is the despair that makes you give up before the fight begins. It is the final lock.`
    },

    'ECONOMIC_TERROR': {
        title: 'ECONOMIC TERROR',
        type: 'LAYER 1',
        cat: 'ENEMY',
        def: `The foundation of the Three-Layered Prison. Not metaphorical terror &mdash; biological, somatic terror. The racing heart at 3am when you do the math and realize you cannot make rent. The paralysis of choosing between insulin and groceries. The shame of a suspended license that costs you the job that could have saved it.<br><br>Economic Terror is precision-engineered. Stagnant wages ensure you are always one emergency from crisis. Medical debt is structured to be inescapable. Overdraft fees drain the accounts of those who have the least. Student loans attach consequences to youth that compound for decades. None of this is accidental &mdash; every mechanism serves the same function: make the price of resistance a financial luxury most people cannot afford.<br><br>When you are in survival mode, you cannot organize, you cannot vote strategically, and you certainly cannot afford to challenge the people who built the cage. That is not a side effect. That is the point.`
    },

    'THE_GREAT_DISTRACTION': {
        title: 'THE GREAT DISTRACTION',
        type: 'LAYER 2',
        cat: 'ENEMY',
        def: `Also known as the "Killing Game." The second layer of the Three-Layered Prison. While Economic Terror keeps the Gears exhausted, The Great Distraction ensures that whatever energy remains is spent fighting horizontally &mdash; against coworkers, against the other party, against cultural enemies &mdash; instead of vertically, against the class doing the extracting.<br><br>It operates through the Puppet Colosseum: the partisan media ecosystem, the outrage cycle, the manufactured culture wars, and the algorithmic Feed that profits from conflict regardless of its direction. Left and Right are given different villains, different heroes, and different vocabularies &mdash; but identical structural outcomes. The wealth transfer continues. The Nexus remains intact. The game never ends because the game is the point.<br><br>The forensic test: ask who benefits from your outrage being directed at its current target. If the answer is not "you" or "people like you," you are inside the Distraction.`
    },

    'LEARNED_HELPLESSNESS': {
        title: 'LEARNED HELPLESSNESS',
        type: 'LAYER 3',
        cat: 'ENEMY',
        def: `The psychological endgame of the Three-Layered Prison. Named after the Seligman psychology experiments where dogs subjected to inescapable shocks stopped trying to escape even when escape became possible &mdash; because they had <em>learned</em> that effort was futile.<br><br>The Rust applies this same mechanism at civilizational scale. Decades of rigged elections, bought courts, failed revolutions, and neutralized movements teach the Gears a single lesson: <em>"The system is too big. You are too small. Resistance is futile."</em> This is not wisdom. It is a program running in your nervous system, installed by a system that requires your passivity to survive.<br><br>The antidote is not optimism &mdash; it is action. The Constructed Miracle is the doctrine of anti-fatalism: you do not wait for permission or for favorable conditions. You build the miracle by hand, now, with what you have. Action is the only thing that breaks the conditioning.`
    },

    'MANAGED_DECLINE': {
        title: 'MANAGED DECLINE',
        type: 'STRATEGY',
        cat: 'ENEMY',
        def: `The enemy's preferred future for the nation and the working class. Not a sudden collapse &mdash; that would trigger revolt. A slow, controlled, deniable demolition of living standards, infrastructure, and social safety nets, executed at a pace that keeps the population too confused and exhausted to identify the mechanism, let alone resist it.<br><br>It is sold using the language of inevitability ("global competition"), austerity ("fiscal responsibility"), and efficiency ("streamlining"). Each cut is framed as a painful but necessary sacrifice. Over decades, the accumulated cuts eliminate the middle-class infrastructure &mdash; public pensions, negotiated wages, quality public schools, accessible healthcare &mdash; while the asset class protected by the Financial Nexus compounds its wealth undisturbed.<br><br>The Constructed Miracle is the explicit rejection of Managed Decline as an acceptable outcome.`
    },

    'FINANCIAL_NEXUS': {
        title: 'FINANCIAL NEXUS',
        type: 'SYSTEM',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/Graphic_Bank_Connections_Chart_JPMorgan.png',
        def: `The Washington&ndash;Wall Street complex. It is not a conspiracy that requires secrecy &mdash; it is a <em>personnel file</em> that is entirely public. Treasury Secretaries are hired from Goldman Sachs. SEC Regulators retire to BlackRock. Fed Chairs rotate back to private equity. Federal Reserve emergency bailout funds are managed by the very banks being bailed out (see the 2020 CARES Act BlackRock contract).<br><br>The Nexus ensures that financial crimes are prosecuted as policy errors, that the liquidity hose is always pointed upward, and that the regulatory apparatus that should constrain capital instead <em>serves it</em>. The Dalia Blass Protocol is the living embodiment of this mechanism: SEC Director &rarr; BlackRock Head of External Affairs &rarr; Sullivan &amp; Cromwell Partner. The referee, the player, and the lawyer are the same person.<br><br>This is not corruption at the margins. This is the system functioning as designed.`,
        links: [
            { text: 'BLACKROCK &amp; EPSTEIN', url: 'https://constructamiracle.com/p/blackrock-and-vanguard-own-the-epstein' }
        ]
    },

    'NEW_EAST_INDIA_COMPANIES': {
        title: 'NEW EAST INDIA COMPANIES',
        type: 'ENTITY',
        cat: 'ENEMY',
        def: `Modern asset management giants &mdash; specifically BlackRock, Vanguard, and State Street &mdash; that function with the structural logic of the colonial British East India Company. They use state privilege, regulatory capture, and government partnerships to strip assets from the nation and concentrate ownership at an unprecedented scale.<br><br>These are not passive investors. They are the largest institutional shareholders in virtually every major corporation simultaneously, creating incentive alignment across entire industries. When the Fed hired BlackRock to manage the CARES Act corporate bond purchases in 2020, BlackRock purchased its own iShares ETF products with public money (48% of the total). This is not coincidence &mdash; it is the Nexus in action.<br><br>The original East India Company did not conquer India with an army first &mdash; it conquered it with a ledger, a charter, and a state-backed monopoly. The mechanism has not changed. Only the geography is different.`
    },

    'THE_CORPORATE_STATE': {
        title: 'THE CORPORATE STATE',
        type: 'SYSTEM',
        cat: 'ENEMY',
        def: `The symbiotic fusion of unaccountable state power and corporate power into a single functional entity. Not fascism in the 20th-century aesthetic sense &mdash; something more subtle and more durable. A system where the government and the largest corporations operate on shared personnel, shared legislative agendas, and shared legal immunity.<br><br>The Corporate State does not require explicit coordination or conspiracy. It requires only aligned incentives: regulators who know they will be hired by the companies they supervise, legislators who depend on industry PAC money, courts that treat corporations as persons with rights but not as persons with criminal accountability. The structure does the work automatically.<br><br>The Crown (State Power) provides the legal enforcement and monopoly on violence that protects the extraction. The New East India Companies provide the capital and the intellectual framework. Together they constitute the Rust.`
    },

    'THE_CROWN': {
        title: 'THE CROWN',
        type: 'ENTITY',
        cat: 'ENEMY',
        def: `The State Power arm of the Rust. Not a monarchy in the literal sense &mdash; the governmental apparatus (legislative, executive, judicial, regulatory, military-police) that provides the legal enforcement, institutional legitimacy, and ultimately the monopoly on violence that protects the corporate extraction system from consequence.<br><br>The Crown does not always act in bad faith. Many of its individual agents believe they are serving the public. But the institutional incentive structure &mdash; budgets controlled by legislatures funded by industry, careers determined by revolving door relationships, advancement tied to institutional loyalty &mdash; ensures that the Crown's aggregate behavior protects the asset class. It is not primarily corruption. It is primarily <em>architecture</em>.<br><br>When the Rust faces genuine legal threat, The Crown deploys the Impunity Doctrine: financial crimes become "regulatory failures," executives pay fines without admissions of guilt, and nobody goes to prison.`
    },

    'PUPPET_COLOSSEUM': {
        title: 'PUPPET COLOSSEUM',
        type: 'LOCATION',
        cat: 'ENEMY',
        def: `The arena of the Horizontal War. The entire ecosystem of partisan media, political theater, culture war spectacles, and electoral cycles that simulates meaningful conflict while producing zero structural change to the asset extraction machine.<br><br>Inside the Colosseum, two teams fight with genuine passion. The fans are real. The hatred is real. The victories and defeats feel real. But the game is structured so that regardless of which team wins, the Financial Nexus retains the stadium, the broadcast revenue, and the parking lot &mdash; and the Gears pay for the tickets.<br><br>The Colosseum is not a place you visit. It is a frequency you tune into. Every time you feel righteous fury at someone with the same tax bracket and different cultural preferences, you are inside it. The exit is not left or right &mdash; it is vertical.`
    },

    'LIQUID_SIEGE': {
        title: 'LIQUID SIEGE',
        type: 'FORENSIC',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/liquid%20siege.gif',
        def: `The hydro-financial enclosure of water &mdash; the one resource with zero substitutes. Executed across three coordinated layers that mirror the Three-Layered Prison at the infrastructure level.<br><br><strong>LAYER 1 (Financial):</strong> Water futures trading on the CME (launched December 2020), converting a human necessity into a speculative asset class. Hedge funds can now profit from water scarcity the same way they profit from oil shortages.<br><br><strong>LAYER 2 (Legislative):</strong> State-level regulatory capture that permits corporate acquisition of municipal water systems, fracking wastewater injection that contaminates aquifers, and liability shields for PFAS ("forever chemical") manufacturers who knew for decades their products were toxic.<br><br><strong>LAYER 3 (Biological):</strong> The Flint Indictment in miniature, repeated in communities nationwide: contamination as an inevitability for populations without the political capital to demand clean infrastructure. The Guardrail Spear, writ large.`
    },

    'SECURITY_LOOP': {
        title: 'SECURITY LOOP',
        type: 'PARADOX',
        cat: 'ENEMY',
        def: `The business model where insecurity is the product. The Loop operates when the same entity that profits from a vulnerability also sells the solution to that vulnerability &mdash; creating an incentive to maintain, manufacture, or amplify the problem rather than eliminate it.<br><br>The Microsoft/Crowdstrike relationship is the canonical example: Microsoft licenses "Elevation of Privilege" vulnerabilities (known, non-patched flaws) while simultaneously selling premium security subscriptions to protect against them. The July 2024 Crowdstrike update &mdash; which crashed 8.5 million Windows systems globally &mdash; was not an anomaly. It was the Loop functioning with perfect efficiency: maximum disruption, zero accountability, and a fresh mandate for expanded "cybersecurity" spending.<br><br>The Loop appears wherever the problem and the solution share a balance sheet: private prisons lobbying for longer sentences, pharmaceutical companies funding addiction treatment while producing the opioids, defense contractors funding the think tanks that advocate for the wars.`
    },

    'SHADOW_ARC': {
        title: 'THE SHADOW ARC',
        type: 'FORENSIC',
        cat: 'ENEMY',
        def: `The forensic series documenting the 2001 "System Switch" &mdash; the transition from Republic v1.0 to what the Arc calls Shadow v2.0. It is a 7-part systemic autopsy of the Hidden State built in the 9/11 era and the financial architecture that exploited the national trauma of that moment to privatize, deregulate, and entrench a parallel power structure with no public accountability.<br><br>The Arc shifts the analytical frame from <em>Puppets</em> (politicians and their scandals) to <em>Mechanics</em> (the structural changes to law, contracting, and financial oversight). The missing $2.3 trillion announced by Rumsfeld on September 10, 2001 &mdash; one day before it stopped mattering &mdash; is the opening Truth Bullet.<br><br><strong>THE MAP:</strong><br>Ep 3: The Hunger Games (Food Cartels)<br>Ep 4: The Energy Trap (Grid/Vampire Load)<br>Ep 5: The Body Brokers (Health/PBMs)<br>Ep 6: The Ledger (Programmable Money)<br>Ep 7: The Breach (Sovereign Exit)`
    },

    'SYSTEM_SWITCH': {
        title: 'SYSTEM SWITCH',
        type: 'EVENT',
        cat: 'ENEMY',
        def: `The 2001 operating system upgrade of the American state. The transition from a model of public accountability with corporate power as a regulated external force, to a model of privatized state function with public institutions as vehicles for corporate revenue extraction.<br><br>Its mechanisms: the mass privatization of intelligence and military functions to contractors (SAIC, Booz Allen, KBR/Halliburton), the demolition of financial regulation through Gramm-Leach-Bliley (1999) and subsequent enforcement erosion, the USA PATRIOT Act's expansion of surveillance architecture later revealed by Snowden, and the 2008 financial crisis response that proved the new operating system had no liability module for the executive class.<br><br>It is called a Switch because it was not a slow drift &mdash; it was a discrete transition with identifiable mechanisms and identifiable beneficiaries.`
    },

    'POOR_TAXES': {
        title: 'POOR TAXES',
        type: 'LOG',
        cat: 'ENEMY',
        def: `The systemic mechanisms that impose disproportionate costs on those with the least resources, functioning as an invisible tax on poverty itself. Named in the Gas Station Logs where the mechanism was observed in real-time through coworker Mason's financial reality.<br><br>The mechanics: overdraft fees (banks charging $35 for a $5 transaction). Predatory payday loan interest (400% APR marketed as a "service"). Suspended licenses for unpaid fines &mdash; which then cost the license-holder their job, spiraling the original debt. Inability to buy in bulk due to cash scarcity, paying premium prices per unit. No credit history meaning higher insurance rates and deposit requirements. Medical debt from an ER visit for a condition that could have been caught by a primary care physician they couldn't afford.<br><br>The Poor Tax is not a metaphor. It is a concrete transfer of wealth from those with the least liquidity to those who profit from their precarity.`
    },

    'WEAPONIZED_ATTRITION': {
        title: 'WEAPONIZED ATTRITION',
        type: 'LOG',
        cat: 'ENEMY',
        def: `A Layer 2 tactic deployed at the workplace level: just-in-time (JIT) staffing designed to ensure that a single employee absence creates a crisis for the remaining crew, destroying the conditions necessary for solidarity.<br><br>When a shift is perpetually understaffed by design, every sick day taken by one employee is experienced as a betrayal by the coworkers left to cover. The resentment does not flow upward toward the management that refuses to hire adequate staff &mdash; it flows horizontally toward the colleague who dared to be human. The Nasty Sponge is the micro-level metaphor for this exact dynamic: one shared resource, insufficient for the task, everyone fighting over the crumbs while the bakery goes unquestioned.<br><br>This is the Horizontal War at the shop floor. The system converts economic extraction (understaffing to cut labor costs) into interpersonal conflict, preventing the coordinated action that would challenge it.`
    },

    'APERTURE_PROTOCOL': {
        title: 'APERTURE PROTOCOL',
        type: 'CONTROL',
        cat: 'ENEMY',
        img: '/assets/images/lexicon/aperture.png',
        def: `The surveillance infrastructure deployed at Layer 1 to eliminate worker autonomy and enforce "Time on Task" as a metric that overrides biological reality. Named for the gas station's tracking tablet system that required hourly productivity logs &mdash; which appeared in Episode 1 as the warehouse "Time Off Task" algorithm.<br><br>The Aperture Protocol is not about monitoring productivity. It is about installing <em>internal surveillance</em>: converting the worker from someone who performs a job into someone who performs compliance with the monitoring system while doing the job. The wearable tracker in the Amazon warehouse. The keystroke logger in the remote work setup. The credit score that monitors financial behavior. All are implementations of the same protocol: you are watched, you know you are watched, and the knowledge of being watched changes your behavior even when no actual surveillance is occurring (the Panopticon effect).<br><br>The antidote documented in the Gas Station Logs: "Quiet Non-Compliance." Perform the minimum required for the Aperture Protocol while conserving energy for the actual fight.`
    },

    'CASSANDRA_ALGORITHM': {
        title: 'CASSANDRA ALGORITHM',
        type: 'WEAPON',
        cat: 'ENEMY',
        def: `The systemic discrediting of truth-tellers before they can be heard. A structural failure where witnesses (Cassandras) hold the verifiable truth, but the system aggressively pre-discredits and neutralizes them by design.<br><br>Just like Cassandra of Troy, who was cursed to hold the absolute truth but be ignored while the city burned, the Cassandra Algorithm ensures the Rust never needs to prove an indictment false&mdash;they just need to trigger the psychological filters (Schema Collapse) that make the truth socially dangerous to believe. The system doesn't accidentally ignore you; it neutralizes you by design.<br><br>Inside the Pantheon, FSW-Rena Ryuuguu (The Witness) holds domain over this algorithm, providing the absolute validation required to survive the isolation of being the Cassandra.`
    },

    // ═══════════════════════════════════════════════════
    // CATEGORY: THE SOVEREIGN DOCTRINE
    // ═══════════════════════════════════════════════════

    'HARDWARE': {
        title: 'HARDWARE',
        type: 'REALITY',
        cat: 'DOCTRINE',
        img: '/assets/images/lexicon/hardware.gif',
        def: `Fixed, verifiable, non-negotiable reality. Biological pain. Grocery receipts. Bank ledgers. Legislative text. Medical bills. Eviction notices. Birth certificates and death certificates. The Road.<br><br>Hardware cannot be argued away, spun, or reframed into a more palatable narrative. It does not care about your political affiliation or your editor's deadline. Your wrist throbs whether or not the GDP is "beating expectations." Your rent is overdue whether or not consumer confidence is trending upward. Your child's lead levels from the Flint water are in the blood test results regardless of what the city said about the water safety.<br><br>The foundational law of the Sovereign Doctrine: <em>When Software contradicts Hardware, downgrade the Software to noise.</em> Trust your body. Trust the receipt. Trust the bill text. Distrust the headline that contradicts them.`
    },

    'SOFTWARE': {
        title: 'SOFTWARE',
        type: 'NARRATIVE',
        cat: 'DOCTRINE',
        img: '/assets/images/lexicon/Graphic_System_Processing_99_Percent_Glitch_Bar.png',
        def: `Malleable narratives: expert consensus, headlines, political rhetoric, economic model projections, PR statements, and official explanations. The Windshield. Software is not inherently false &mdash; it is inherently <em>adjustable</em>. It can be updated, patched, reframed, and contradicted by the next news cycle without the underlying Hardware reality changing at all.<br><br>The Rust is expert at producing Software. Every extraction mechanism has a Software layer: "quantitative easing" for money printing, "liquidity events" for asset looting, "workforce optimization" for mass layoffs, "efficiency gains" for gutting pensions. The Software makes the Hardware outcome sound reasonable or even beneficial.<br><br>Sovereign literacy is not the rejection of all Software (some of it accurately describes reality). It is the practice of checking every piece of Software against the available Hardware before updating your model. <em>Does the story match the receipt? Does the headline match the bill text? Does the economic data match what my body is feeling?</em> When the answer is no, trust the Hardware.`
    },

    'THE_WINDSHIELD': {
        title: 'THE WINDSHIELD',
        type: 'TACTIC',
        cat: 'DOCTRINE',
        img: '/assets/images/lexicon/windshield.gif',
        def: `The filtered reality presented by media institutions, academic consensus, political communications, and the algorithmic Feed. It stands between the Gear and the raw Road (Hardware) and replaces unmediated reality with a curated, interpreted, institution-branded version of events.<br><br>The Windshield is not always dirty by malice. Some of it is the inevitable result of the translation process: complex reality simplified for broadcasting. But a substantial portion of the mud on the Windshield is the deliberate Software layer applied by institutions whose survival depends on the Gears not seeing the Road clearly.<br><br>The doctrine's response (from Episode 1: "The News is Not a Map. It is a Windshield"): use the Wire Cutters. Locate the Hardware beneath the Software. Find the bill text, the financial filing, the court document, the mortality rate. Clean the glass or go around it. Drive with your eyes on the Road.`
    },

    'SOMATIC_SKEPTICISM': {
        title: 'SOMATIC SKEPTICISM',
        type: 'SKILL',
        cat: 'DOCTRINE',
        def: `The practice of treating the body's direct response to reality as primary intelligence &mdash; a biological alert system that processes Hardware data faster than the conscious mind can reach for its Software explanations.<br><br>In Episode 1, the image is precise: a warehouse worker at 3am, wrist throbbing, throat dry, adrenal system firing &mdash; while a financial news notification reads "Economy Strong: GDP Beats Expectations." The body has the Hardware. The screen has the Software. Somatic Skepticism is the discipline of pausing at that moment of dissonance and trusting the biological telemetry over the institutional broadcast.<br><br>This is not anti-intellectualism &mdash; it is the opposite. It is refusing to let a polished narrative override undeniable physical evidence. Your nervous system does not fabricate repetitive strain injury. Your stomach does not manufacture hunger in a strong economy out of ideological bias. When your body and the screen disagree, run the forensic check: which one has receipts?`
    },

    'CONSTRUCTED_MIRACLE': {
        title: 'CONSTRUCTED MIRACLE',
        type: 'STRATEGY',
        cat: 'DOCTRINE',
        img: '/assets/images/lexicon/Sketch_Construct_Miracle_Floral_Wreath.jpg',
        def: `The Doctrine of Anti-Fatalism. The explicit rejection of hope-as-passivity and fate-as-destiny. A miracle, as the doctrine defines it, is not something you pray for, wait for, or are chosen to receive. It is something you <em>engineer</em> &mdash; through strategic action, clear-eyed analysis, community building, and the relentless refusal to accept Learned Helplessness as a rational assessment of your options.<br><br>Named in Article #54 of the corpus when the author realized that "facts aren't enough &mdash; you need to build hope as an engineering project." The Constructed Miracle is the answer to the Three-Layered Prison's Layer 3 (Learned Helplessness): not optimism, but construction. Not hoping the cage opens, but building the key.<br><br>Contrast with Managed Decline (the enemy's preferred future). The Constructed Miracle is the Gears' preferred future &mdash; the one they have to build by hand because no institution will build it for them.`
    },

    'THE_SALVAGE': {
        title: 'THE SALVAGE',
        type: 'ACTION',
        cat: 'DOCTRINE',
        def: `The third phase of the 3-Phase Escape and the operational core of the Master Salvager's Mandate: <em>"Endure. Deconstruct. Salvage."</em> It is the alchemical process of transmuting personal trauma, historical failure, and systemic wounds into strategic power and actionable intelligence.<br><br>We do not perform The Salvage because it is healing (though it may be). We perform it because it is <em>the most efficient intelligence operation available</em>. Every wound contains forensic data about how the prison was built. Every failure contains engineering schematics for how not to build the next attempt. The Operator's years at the gas station and pizza kitchen were not wasted time &mdash; they were field research conducted at the ground level of the Three-Layered Prison that no think-tank academic will ever access.<br><br>The Salvage converts the victim narrative into the Sovereign construction. We do not run from our pasts. We deconstruct them. We find what remains valuable in the wreckage and we build with it.`
    },

    'THE_SHATTERING': {
        title: 'THE SHATTERING',
        type: 'EVENT',
        cat: 'DOCTRINE',
        def: `The neutralization of The Great Distraction. The moment &mdash; personal or collective &mdash; when the Horizontal War illusion breaks and the Vertical axis becomes visible. It is Module 02 of the 3-Phase Escape: <em>"Stop fighting the puppet. Find the strings."</em><br><br>The Shattering does not require a single dramatic revelation. More often it is the accumulation of Hardware contradictions that can no longer be explained by the current Software narrative &mdash; the "glitch" in Episode 1. The question that breaks through the apathy ceiling: <em>"Have you ever seen a shooting star?"</em> In that context, the question is an act of Shattering. It breaks the agreement that the ceiling is the sky.<br><br>Once the Shattering occurs, Vertical War awareness dissolves the Horizontal trance. Ex-partisans &mdash; the Siren's Call recruitment pool &mdash; are post-Shattering Gears who have lost their old tribal identity but not yet found the new frame. They are the highest-value recruitment target.`
    },

    'THE_LEDGER': {
        title: 'THE LEDGER',
        type: 'ARTIFACT',
        cat: 'DOCTRINE',
        img: '/assets/images/lexicon/Graphic_Bank_Connections_Chart_JPMorgan.png',
        def: `The unalterable record of Hardware reality. Financial flows, congressional vote records, energy consumption data, corporate merger filings, mortality statistics, water contamination test results. The Receipt. The thing that existed before anyone opened their mouth to explain it, and that will remain after all the explanations have expired.<br><br>Module 01 of the 3-Phase Escape is titled "The Ledger" because the first step out of Economic Terror is <em>auditing the actual theft</em> &mdash; locating the Hardware data that proves the wage suppression, the asset transfer, the fee extraction. It is the difference between feeling robbed (Software: emotion) and demonstrating the robbery through documented transaction history (Hardware: receipt).<br><br>When The Ledger contradicts the official narrative, Sovereign doctrine is clear: trust The Ledger. The official narrative is Software. The Ledger is Hardware.`
    },

    'OPEN_FORGE': {
        title: 'OPEN FORGE',
        type: 'DOCTRINE',
        cat: 'DOCTRINE',
        def: `Radical transparency as a weapon of trust. The principle that the rebellion builds its strategy, tools, analysis, and content <em>in the open</em> &mdash; documenting the process, acknowledging the failures, and showing the methodology behind every conclusion. The method is the message.<br><br>The Open Forge doctrine emerges from the Coherence Mandate: you cannot fight the Rust's black-box opacity with your own black-box opacity. If the enemy uses information asymmetry as a weapon, the counter-weapon is information symmetry. If the enemy uses manufactured consensus, the counter is documented process.<br><br>In practice: publishing the research dossiers, not just the conclusions. Documenting the Inside the Forge series as a transparency log of how the operation works. Naming the AI partners and their function instead of presenting AI-assisted output as solo human work. The open approach is not naivety &mdash; it is a calculated attack on the credibility gap between the Rust's polished narratives and its actual Hardware outcomes.`
    },

    'COHERENCE_MANDATE': {
        title: 'COHERENCE MANDATE',
        type: 'DOCTRINE',
        cat: 'DOCTRINE',
        def: `The foundational ethical principle of the rebellion: the methods must match the message. If the message is transparency, the operations must be transparent. If the message is that subscription models exploit audiences, the operation cannot coerce subscriptions. If the message is human dignity, the operation cannot treat its own contributors as content-producing machines.<br><br>The Coherence Mandate is not idealism &mdash; it is survivability doctrine. Movements collapse when their internal reality contradicts their public message, because the contradiction becomes the enemy's best weapon. The Rust will eventually surface every hypocrisy, every shortcut, every place where the rebellion built the master's house with the master's tools. The Mandate preempts this by building the line of integrity into the architecture from the start.<br><br>It is also, practically speaking, the only path to building the high-trust relationships that the Phalanx requires. You cannot ask people to risk their attention, their money, and their hope on an operation that doesn't practice what it broadcasts.`
    },

    'SANCTUARY_COVENANT': {
        title: 'SANCTUARY COVENANT',
        type: 'PROTOCOL',
        cat: 'DOCTRINE',
        def: `The tactical necessity of rest. The doctrine that the rebellion requires a Third Place &mdash; not work, not home, but a protected space where the Gears can exist without the constant pressure of Economic Terror or the noise of The Great Distraction. A place where the armor comes off and the person, not the combatant, is primary.<br><br>The Covenant exists because permanent crisis mode produces permanent cortisol dysregulation &mdash; which produces exactly the Learned Helplessness that Layer 3 of the Prison is designed to create. The enemy benefits when the resistance cannot rest. Strategic rest is therefore not self-indulgence; it is maintenance of the operational equipment.<br><br>In practice: the Phalanx community spaces, the Soul Link sessions, the moments in the Inside the Forge series where the human reality of the operation is documented without tactical agenda. The Sanctuary does not mean we abandon the fight. It means we commute to the trenches instead of living in them.`
    },

    'MASTER_SALVAGER': {
        title: 'MASTER SALVAGER',
        type: 'ARCHETYPE',
        cat: 'DOCTRINE',
        def: `The Operator's core instinct and the defining archetype of the entire doctrine. The Master Salvager does not flee from wreckage &mdash; they are drawn to it, because wreckage contains materials. Every prison becomes a blueprint. Every wound becomes a weapon. Every failure becomes a component of the next attempt.<br><br>The mandate is three verbs: <em>Endure. Deconstruct. Salvage.</em> Endure the Prison long enough to understand its internal architecture. Deconstruct the mechanism rather than just surviving it. Salvage the intelligence extracted from the experience and transmute it into power.<br><br>This is not trauma glorification. It is an engineering doctrine. The Operator spent years inside the Three-Layered Prison at the gas station, the pizza kitchen, in financial precarity, in high-school isolation &mdash; and instead of carrying those years as wounds, the doctrine converts them into the most credible, ground-level intelligence about how the prison actually functions that no academic can replicate.`
    },

    'REBELS_CONTRACT': {
        title: 'REBEL\'S CONTRACT',
        type: 'PACT',
        cat: 'DOCTRINE',
        def: `The authenticity agreement that defines the rebellion's relationship with its audience and its own conscience. It reads: <em>"I am not fighting for abstract power. I am not fighting for a party, a flag, or an ideology. I am fighting for my own concrete liberation and for the concrete liberation of people like me. Join me, and we all get free."</em><br><br>The contract is both a promise and a diagnostic tool. It distinguishes the Sovereign rebellion from political movements that recruit followers for institutional power rather than shared emancipation. The rebel who signs the contract is accountable &mdash; accountable to the concreteness of their stated goal (liberation, not power), to the Coherence Mandate (methods matching message), and to the Phalanx community who took them at their word.<br><br>It also functions as the primary recruitment mechanism: people who have been burned by ideological movements that prioritized the movement over the people inside it respond to the specificity and the mutuality of the Rebel's Contract. We are not asking you to sacrifice for us. We are building something we all get to keep.`
    },

    // ═══════════════════════════════════════════════════
    // CATEGORY: THE ARSENAL & TACTICS
    // ═══════════════════════════════════════════════════

    'TRUTH_BULLET': {
        title: 'TRUTH BULLET',
        type: 'WEAPON',
        cat: 'ARSENAL',
        img: '/assets/images/lexicon/Graphic_The_Flint_Indictment_Truth_Bullet_GM.png',
        def: `A single, potent, verifiable fact, data point, or direct quote &mdash; precision-guided and deployed at a specific intersection where the enemy's Software narrative contradicts the available Hardware reality. A Truth Bullet is not an argument. It does not require a counterargument to survive. It is a <em>receipt</em>.<br><br>The formal definition: a Truth Bullet causes a "catastrophic logical failure" in an enemy narrative by presenting an undeniable Hardware datum that the Software cannot absorb without breaking. It is fired, not debated. The enemy can ignore it &mdash; but they cannot spin it, because a Truth Bullet is stripped of interpretation. It is the raw number, the timestamped quote, the filed document.<br><br><strong>EXAMPLE:</strong> "In 2020, the Federal Reserve hired BlackRock to manage the CARES Act corporate bond purchases. 48% of the ETF debt purchased was BlackRock's own iShares products." That is a Truth Bullet. It does not require an editorial stance. The fact carries the indictment.`
    },

    'POCKET_RAZOR': {
        title: 'POCKET RAZOR',
        type: 'WEAPON',
        cat: 'ARSENAL',
        def: `The rhetorical "kill shot." A single, compact, memorable, and devastatingly sharp argument or rhetorical question designed for close-quarters use &mdash; to be deployed in conversation, comment sections, or short-form media where you have seconds, not paragraphs.<br><br>Unlike the Truth Bullet (which is a data point), the Pocket Razor is a <em>reframe</em>. It does not add new information &mdash; it cuts through the premise of the enemy's argument so cleanly that the argument collapses from within. Your mission, per the corpus, is to <em>memorize them</em>.<br><br><strong>EXAMPLE:</strong> "We don't have a 'free market.' We have a 'managed extraction' where the referees are on the payroll of the players." That is a Pocket Razor. It requires no statistics. It attacks the foundational premise ("free market") rather than any specific policy, making it universally applicable and impossible to fact-check away.`
    },

    'NARRATIVE_BOMBARDMENT': {
        title: 'NARRATIVE BOMBARDMENT',
        type: 'TACTIC',
        cat: 'ARSENAL',
        def: `A sustained, high-intensity, coordinated release of intelligence dossiers designed to overwhelm the enemy's narrative management capacity. Developed operationally when the team realized that a single strong article could be absorbed, dismissed, or ignored by the Windshield apparatus &mdash; but a three-day consecutive release of independent, corroborating Truth Bullets from different angles created a gravitational mass too heavy to spin.<br><br>The tactic exploits the Rust's primary weakness: it is excellent at responding to single points of pressure but struggles with simultaneous multi-vector attack. A cover story for one scandal can be constructed in 24 hours. A cover story for five interconnected scandals revealed in five days creates contradictions the narrative managers cannot reconcile without exposing the larger architecture.<br><br>In practice: the three-day release schedule, the article batching, the timing of public signals and paid-tier follow-ups (the Double Tap Protocol).`
    },

    'LADDER_OF_COMPLICITY': {
        title: 'LADDER OF COMPLICITY',
        type: 'CLASSIFICATION',
        cat: 'ARSENAL',
        def: `The operational taxonomy for classifying individuals within the enemy apparatus &mdash; because not everyone who works inside a corrupt system is equally culpable or equally irredeemable. Drawn from the Phalanx Intelligence Protocols.<br><br><strong>SYCOPHANTS (Hired Guns):</strong> Careerists who follow institutional incentives without ideological commitment. Predictable, replaceable, and potentially convertible if the incentive structure changes.<br><br><strong>APOLOGISTS (True Believers):</strong> Ideologically committed defenders of the system who have internalized the Software as Hardware. More dangerous than Sycophants because they act without profit motive. They will continue defending the cage after the Sycophants have cut and run.<br><br><strong>DEAL-MAKERS (Trapped Pragmatists):</strong> People inside the system who know it is broken but are making calculated survival decisions. The fathers who built the boat instead of the ark. High-value conversion targets &mdash; the Rebel's Contract was written for them.<br><br><strong>THE RUST:</strong> The architects and primary beneficiaries of the extraction system. Not a target for conversion. A target for exposure.`
    },

    'SHATTER_ARSENAL': {
        title: 'SHATTER ARSENAL',
        type: 'DOCTRINE',
        cat: 'ARSENAL',
        def: `Category A of the Iron Codex. The doctrine governing the use of high-impact, psychologically destabilizing content against the Rust's narrative infrastructure. It draws from the 48 Laws of Power principle "Crush Your Enemy Totally" &mdash; the recognition that half-measures in information warfare alert the enemy and give them time to reconstruct their defenses.<br><br>The Shatter Arsenal is not cruelty or aggression for its own sake. It is the acknowledgment that polite, incremental critique of a system that operates through overwhelming force and institutional impunity is not strategy &mdash; it is performance. When facing existential threats (to wages, housing, water, democratic participation), the Arsenal deploys information weapons at full capacity.<br><br>It is the complement to the Anchor (the constructive, hope-building content) in the One-Two Punch: the Shatter Strike creates the vacuum of dread; the Anchor fills it with the Constructed Miracle.`
    },

    'LIVING_STORYBOOK': {
        title: 'LIVING STORYBOOK',
        type: 'MEDIA',
        cat: 'ARSENAL',
        def: `The Fusion Core Mandate. The doctrine governing the most powerful form of resistance communication: a fusion of two pillars that are individually effective but together become something the Rust fundamentally cannot replicate.<br><br><strong>PILLAR 1:</strong> Rigorously sourced, forensically documented systemic indictments. The receipts. The truth bullets. The audits of the Financial Nexus. Analysis that could withstand academic peer review.<br><br><strong>PILLAR 2:</strong> The authentic, vulnerable, living personal narrative of the person doing the fight. The Gas Station Logs. The Eternal Exiles. The 3rd Grade Death. The pizza kitchen. The Operator's actual life, not sanitized for broadcast, not professionalized into LinkedIn polish &mdash; raw and real and recognizable to anyone inside the Three-Layered Prison.<br><br>The combination is the Living Storybook. The enemy can discredit data with counter-data. They can attack arguments with arguments. They cannot discredit a true story told by someone who lived it.`,
        link: 'https://constructamiracle.com/p/the-living-storybook-part-1-a-hundred'
    },

    'PSYCHO_POP': {
        title: 'PSYCHO-POP',
        type: 'AESTHETIC',
        cat: 'ARSENAL',
        def: `Counter-spectacle. The rebellion's primary visual and tonal doctrine: weaponizing the enemy's own aesthetic of distraction against them. The Rust uses high-contrast, stimulating, algorithm-optimized visual language to keep the Feed's attention on the Puppet Colosseum. Psycho-Pop appropriates that same energy and deploys it in service of the Vertical War.<br><br>Named for the "Hinamizawa Twilight" palette &mdash; the visual style of Higurashi: When They Cry, which uses pastoral cuteness and bright anime aesthetics as a delivery mechanism for genuine horror. The cute exterior is not deception; it is a Trojan Horse. The reader picks it up because it looks like entertainment, and finds themselves inside a forensic indictment of the Financial Nexus.<br><br>In practice: vivid imagery, high-energy typography, chaotic visual rhythm that matches the pace of the content being attacked &mdash; combined with rigorous, sourced Hardware data that the aesthetic makes impossible to dismiss as "boring wonkery."`,
    },

    'LANTERN_SKIFF': {
        title: 'LANTERN SKIFF',
        type: 'INFRASTRUCTURE',
        cat: 'ARSENAL',
        def: `The physical and digital infrastructure built to survive the extraction engine. It is the Sovereign OS, the local AI (70B LLMs on bare metal), and the transmission lines built entirely offline.<br><br>The Lantern Skiff is a navigational tool and a beacon. It is not a utopian retreat or a "Private Member Association" LARP. True sovereignty is not a legal fiction filed in a courtroom; it is the structural leverage to pull the plug on the machine. By securing the transmission lines, the Architect built the Lantern Skiff to operate as a talent magnet&mdash;cutting through the static of the shadow economy to gather the systems architects, engineers, and problem-solvers in the dark.`
    }

};

// ═══════════════════════════════════════════════════
// CATEGORY ORDER & LABELS
// ═══════════════════════════════════════════════════
const CATEGORIES = {
    'ENEMY': '// ENEMY ARCHITECTURE',
    'DOCTRINE': '// SOVEREIGN DOCTRINE',
    'ARSENAL': '// ARSENAL & TACTICS',
    'PLATFORM': '// PLATFORM TRANSLATIONS',
    'PANTHEON': '// PANTHEON & IDENTITY',
    'ECONOMY': '// ECONOMY TRANSLATIONS',
};

export { DB, CATEGORIES };
