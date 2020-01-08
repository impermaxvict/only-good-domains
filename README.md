# Only Good Domains
A Firefox add-on to create blocklists from domains collected while browsing the web.
Whitelist good, judge unknown, blacklist and block bad domains.

[![Download the add-on here](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png)](https://addons.mozilla.org/en-US/firefox/addon/only-good-domains/)

## Required permissions
- Access your data for all websites (`<all_urls>`):
  - The add-on has to see all requests to all websites such that it can record the domains.
- Read requests to websites (`webRequest`):
  - Needed such that the add-on can listen for requests and record the domains.
- Block or redirect requests (`webRequestBlocking`):
  - This permission is required for blocking requests to blacklisted domains.
- Store data locally (`storage`):
  - The blacklist, whitelist and all recorded domains are saved locally.

## About the request blocker
The add-on works as a simple (not very efficient) request blocker according to the following algorithm (the blocker is only concerned about domains):
```
If the domain is in the whitelist:
	Do not block
Else if the domain is in the blacklist:
	Block
Else if the domain has an "upper level":
	Check the domain with the "lowest level" removed
Else the domain is unknown:
	Do not block
```
