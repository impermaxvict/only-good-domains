'use strict';

browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({
		seenDomains: [],
		domainWhitelist: [],
		domainBlacklist: []
	});
});

let seenDomains = new Set();

browser.storage.local.get('seenDomains').then(results => {
	if (results.seenDomains) {
		seenDomains = new Set(results.seenDomains);
	}
});

let domainWhitelist = new Set();
let domainBlacklist = new Set();

browser.storage.local.get('domainWhitelist').then(results => {
	if (results.domainWhitelist) {
		domainWhitelist = new Set(results.domainWhitelist);
	}
});

browser.storage.local.get('domainBlacklist').then(results => {
	if (results.domainBlacklist) {
		domainBlacklist = new Set(results.domainBlacklist);
	}
});

browser.storage.onChanged.addListener(function (changes, area) {
	if (area === 'local') {
		if (changes.domainWhitelist && changes.domainWhitelist.newValue) {
			domainWhitelist = new Set(changes.domainWhitelist.newValue);
		}

		if (changes.domainBlacklist && changes.domainBlacklist.newValue) {
			domainBlacklist = new Set(changes.domainBlacklist.newValue);
		}
	}
});

function isDomainBlocked(domain) {
	if (domainWhitelist.has(domain)) {
		// exact in whitelist
		return false;
	} else if (domainBlacklist.has(domain)) {
		// exact in blacklist
		return true;
	} else if (domain.includes('.')) {
		// check next level
		const nextLevel = domain.substring(domain.indexOf('.') + 1);
		return isDomainBlocked(nextLevel);
	}
	// unknown domain
	return false;
}

browser.webRequest.onBeforeRequest.addListener(
	function (requestDetails) {
		const requestDomain = new URL(requestDetails.url).hostname;

		if (requestDomain && !seenDomains.has(requestDomain)) {
			// If the domain was never seen before, add it to the set of seen domains.
			seenDomains.add(requestDomain);

			browser.storage.local.get('seenDomains').then(results => {
				if (!results.seenDomains.includes(requestDomain)) {
					results.seenDomains.push(requestDomain);
					browser.storage.local.set(results);
				}
			});
		}

		if (isDomainBlocked(requestDomain)) {
			console.log("Blocking", requestDomain);
			return {
				'cancel': true
			};
		}
	}, {
		urls: ["<all_urls>"]
	},
	["blocking"]
);
