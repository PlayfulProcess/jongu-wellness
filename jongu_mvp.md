I want to lunch the mst simple architecture with the least amount of code possible for my MVP. It is more about adding more simple channels, than adding a lot of features to each channel. I believe later I will add an AI assistant across platform that can behave in ways the user would want to and make thorough recomendations, without making naviagtion or algorythms complex.

Stack: still follow most of the principles outlined in Claude.md, however!

1) I want one codebase and one Vercel deployment. THe user can choose a dropdown list of each channel and the channel's content will upload from Supabase.
2) All channels feeds from same Supabase project. Database will be configured for quick deployment and not scalability for now, following the Scheam outlined in the root.
3) Just one publisher per website, community features will be external (either Discord or fediverse, later to be decided)
4) Users can star tools, channels or publishers and see them in different tabs i their admin panel. THey can choose to rank them by newest or by popular (number of stars)
5) If users want to publish content, they need to create their own channel. There will be a link in the header to a publish their own channel. It will be a blank channel page in which they Write it directly on each session what they want to feature:
a) title
b) hero
c) Tool card with up to 5 fields to be filled and show on each card. Each of this fields will feature as a dropdown filter at the top in which the user can filter from all fields enountered in Supabase)
d) about section content.
e) link to their stripe product and their social media community page (might be discord or any other)
The user will not be able to selcet: Sorting system and searchbar (already encoded.

7) In the admin panel, there will be a button for each channel owner to submit their own tools by writing on the e fields they themselves created (enconded in SUpabase as json)
8) Footer will be the same for all channels and I get to decide. (for not, make the same as we have in wellness chanel)
9) HEader: Channel dropdown, Browse, ABout, Donate, Join Community (with their social media link page of their choice), SIgn in. If creator left any of this blanks, it will just not pop up in the header.
10) There will only be one admin panel and that is for me to aprove new channels. 