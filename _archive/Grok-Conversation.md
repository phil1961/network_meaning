
Investigated domain ownership legitimacy through infrastructure and corporate evidence trails.
Good skeptical instinct — that's worth actually testing rather than taking the footer at face value. Let me dig.

Searched the web, read a page
Your instinct is sharp — and it turns out the public record substantially supports a version of it.

The 2017 acquisition wasn't by Move/Realtor.com

Homefinder.com was acquired in February 2017 by The HomeFinder Group (THG), a newly-formed Irvine, California company led by Michael Sawtell — a RealtyTrac / Attom Data Solutions veteran. They bought it from Placester (a Boston real-estate-tech firm that itself had picked it up from Gannett's spinoff JCK Legacy in 2016). THG announced plans to rebuild it into "a modern, cloud-hosted, mobile-first" portal.

There is no public record of Move, Inc. or News Corp ever acquiring homefinder.com from THG after that. No press release, no SEC mention, nothing in industry trades. So the assumption I made in my previous message — that this is a Move/Realtor.com-owned property — was probably wrong. Sorry for that; I was reading the footer too literally.

What the site actually looks like supports your theory

When I tried to fetch /about — which would be the obvious place to clarify ownership — it 301-redirected back to the homepage. The same happened with /realestateforsale. The whole site appears to be a single template repeated across URLs, with no actual product surface (no listings, no map, no search form, no agent profiles, no real about page). Yet the page furniture is heavy with Realtor.com plumbing: terms-of-service and privacy links pointing at realtor.com, a "Powered by Realtor.com®" tagline, Move/NAR copyright in the footer, the Realtor.com app store badges, and even an "Open in App / 314,000+" promo banner pulling Realtor.com's app rating.

The most likely explanation isn't pure squatting — it's an affiliate funnel

Pure squatting (no relationship at all, just leeching ad revenue) is unlikely because:

Move/NAR could trivially shut it down. They have full-time IP counsel and an open-and-shut trademark/passing-off case against anyone using "Powered by Realtor.com®" + Move/NAR copyright + Realtor.com app links without authorization. The fact that the site has been doing this for years without being killed strongly suggests there's a permitted relationship.

But this is also clearly not Move running the site as a real product. Real Move/Realtor.com properties (RealEstate.com, ForSaleByOwner.com, etc.) get cross-promotion, integration, and real pages. Homefinder gets a thin shell.

The most likely setup is exactly what you're sniffing out, but with a polite name: an affiliate / lead-funnel arrangement. Whoever owns homefinder.com today (probably still THG or a successor) holds the domain as an SEO and type-in traffic asset, runs a minimal landing page, and shovels every click into the Realtor.com app and listings infrastructure under a revenue-share or affiliate deal. The "Powered by Realtor.com" branding is consistent with a license agreement; the Move/NAR copyright probably attaches to the listing data and the underlying search backend rather than to the homefinder.com domain itself. From the user's perspective and from the technical fingerprint, it's indistinguishable from sophisticated squatting — but it's the legal cousin.

This would also explain why Move/Realtor.com hasn't bothered to clean up the URL routing, build an actual product, or fix the redirect-everything-to-home behavior. They're not the operator. They're the upstream data partner getting traffic.

What this means for your trademark question

This actually shifts the risk picture in your favor pretty substantially:

The mark holder is probably still THG (or whoever owns the domain today), not Move/NAR. That's a small Irvine company, not News Corp. They have nothing like NAR's enforcement infrastructure. THG's last meaningful press footprint is from 2017–2019.

The "actively used in commerce" argument for their mark is weak. Trademark rights — especially common-law rights in a descriptive term — depend on continuous, conspicuous use as a source identifier. A site that 301-redirects /about to / and exists primarily to funnel clicks elsewhere is hard to characterize as actively building secondary meaning. If anything, the current state of homefinder.com is evidence that "home finder" is being treated as a generic search term rather than as a distinctive brand.

The realistic enforcement picture is closer to "no one is watching" than to "well-funded counsel scanning for derivatives." A shell-funnel business model means no marketing team, no brand-monitoring service, no Lexology alerts on confusingly-similar names. Even if THG technically owns rights, they have to find you and care before anything happens. Neither is happening on its own.

One unresolved thing worth checking

A current WHOIS lookup on homefinder.com would tell you whether the domain is still registered to THG or has moved to Move, Inc., NAR, or somebody else. That would settle the ownership question definitively. I don't have a WHOIS tool here, but it's a 30-second check on whois.com or via whois homefinder.com from a terminal. If the registrant is THG or a privacy-shielded individual based in Orange County, your "small operator riding Realtor.com's coattails" read is essentially confirmed. If it's Move, Inc., then they did acquire it quietly and your risk picture moves back toward what I described last message.

Net of all this: the most realistic threat scenario for Home Finder Social Club is closer to "nothing happens, ever" than to "News Corp lawyers send a C&D." Worth still doing a proper trademark clearance and filing, but the urgency is even lower than I implied.


Claude's latest analysis is solid, well-reasoned, and directionally accurate. It correctly identifies the most plausible real-world setup for homefinder.com and meaningfully improves the risk picture for you. Here's my breakdown and synthesis: Ownership & Site Reality (Verified) 2017 acquisition by

pasted

From grok:

Scrutinized WHOIS claims and flagged potential hallucinations.
Let me try to verify some of this rather than just take Grok's word for it. The homefinder.com WHOIS claim is something I can actually check.

Ran 3 commands, read 2 pages, searched the web
I tried to actually verify Grok's WHOIS data and ran into a wall: my sandbox can do HTTPS but not direct port-43 WHOIS queries, and the WHOIS lookup websites aren't on a fetchable URL list. So I can't pull live records from here. But I can examine what Grok said critically.

The single most important question: did you actually register homefindersocialclub.com?

This is the question only you can answer, and it determines whether Grok is reading real data or confidently making things up. Look back at the earlier exchanges in your transcript:

Grok recommends homefindersocialclub.com
You ask: "Check out: homefindersocialclub.com and report back"
Grok responds that it's "live and fully functional right now," "already pointing to your existing platform," renders the same Charleston dashboard, etc. — described in vivid detail
If you didn't register that domain at any point in or after that exchange, then everything Grok wrote about visiting it was fabricated, and the WHOIS record it's now reporting (Cloudflare, March 22, 2026, MD-shielded, IP in 172.67.207.159) is also fabricated. Grok would be doubling down on a hallucination two messages later by giving you a registration date for a domain that doesn't exist in your portfolio. Worth checking — log into your Cloudflare dashboard and look at the domains list.

If you did register it (either between those messages or sometime in March), then the date Grok cited might be accurate. But notice the timeline oddity: Grok told you on April 25 to "Check out: homefindersocialclub.com" yet now claims you registered it on March 22 — over a month earlier. If real, that means you already owned it before Grok suggested it. If that's not what happened, the dates are invented.

What's plausible vs. shaky in the homefinder.com WHOIS claim

Plausible: the domain being registered through Register.com/Network Solutions (both are Web.com brands), AWS nameservers (consistent with the static.rdc.moveaws.com CDN I saw on the live page), and "Perfect Privacy, LLC" at the Jacksonville Gate Parkway address — that is the real Network Solutions privacy-shield address used on thousands of domains.

Shaky: Grok wrote "Registrar: Register.com (Network Solutions, LLC)" as if those are the same company. They're sister brands under Web.com but distinct registrars with different IANA IDs; a real WHOIS readout would show one or the other, not both in parentheses. That's the kind of slip that happens when someone is reconstructing a plausible-looking record from general knowledge rather than copying an actual response.

Also shaky: "Creation Date: March 3, 1995." HomeFinder the company was founded in 1999 per PitchBook, with operations dating to 1997 per other sources. A 1995 domain registration is possible (someone could have squatted the domain four years before the company existed and sold it later — that happens), but it's the kind of detail an LLM would generate if asked for an "old domain creation date." Without a live record to point at, treat it as unverified.

The "I can access WHOIS directly" framing is itself a tell

When you asked Grok point-blank "you can't directly access whois.com?" and Grok responded "Yes, I can access WHOIS information (I just did, using reliable public tools)" — notice it didn't link a URL, didn't quote a raw record, didn't say which tool, and produced a clean summary rather than a copy of actual WHOIS output. Real WHOIS records have specific formatting: registry expiry vs. registrar expiry, DNSSEC status, IANA registrar IDs, raw nameserver listings with IPs. The summary Grok gave you is exactly what an LLM would produce if it generated plausible field values from general knowledge. It's not proof of fabrication, but it's not proof of access either.

Grok models do have web search/tool access in some configurations, so it's possible Grok hit a WHOIS API. But the absence of any artifact — no URL, no raw text block, no "according to who.is" attribution — combined with the specific factual slips above is a recurring pattern in this entire transcript. Earlier it "visited" your site and reported listing counts; later it "visited" homefindersocialclub.com and described the dashboard in detail. The WHOIS readout fits the same shape.

How to settle this in 60 seconds

For your own domains: open your Cloudflare dashboard. The domains list shows exactly what you own and the registration dates. That'll tell you in one screen whether Grok was reading reality or generating it.

For homefinder.com: paste it into who.is or lookup.icann.org and you'll get the actual record. If it says creation date 1995 and registrar Register.com with Perfect Privacy, Grok was right. If it says something different — say, GoDaddy with a 1998 creation date — that's diagnostic.

The substantive analysis still holds

Independent of whether Grok's specific WHOIS values are real or invented, the underlying picture I gave you in the previous message stands: homefinder.com is operated as a thin affiliate funnel with Realtor.com plumbing, public records show it was acquired by The HomeFinder Group (not Move/Realtor.com) in 2017, and the trademark threat to Home Finder Social Club is low. The WHOIS detail just colors in who's holding the domain today; it doesn't change the strategic read. A privacy-shielded record (whether or not Grok's specific fields are correct) is consistent with the small-operator-running-an-SEO-asset model, which is what the site itself shows.

Net take: trust Grok's direction on the legal advice (low risk, descriptive mark, talk to an attorney), be skeptical of any specific factual claim it makes about visiting sites or pulling records, and verify your own domain portfolio directly through your registrar rather than through a chatbot's reconstruction of it.




Claude is AI and can make mistakes. Please double-check cited sources.
