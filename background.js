browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({
		seenDomains: [],
		domainWhitelist: [],
		domainBlacklist: []
	});
});

let domainWhitelist = [];
let domainBlacklist = [];

browser.storage.local.get('domainWhitelist').then(results => {
	if (results.domainWhitelist) {
		domainWhitelist = results.domainWhitelist;
	}
});

browser.storage.local.get('domainBlacklist').then(results => {
	if (results.domainBlacklist) {
		domainBlacklist = results.domainBlacklist;
	}
});

browser.storage.onChanged.addListener(function (changes, area) {
	if (area === 'local') {
		if (changes.domainWhitelist && changes.domainWhitelist.newValue) {
			domainWhitelist = changes.domainWhitelist.newValue;
		}

		if (changes.domainBlacklist && changes.domainBlacklist.newValue) {
			domainBlacklist = changes.domainBlacklist.newValue;
		}
	}
});

function isDomainBlocked(domain) {
	if (domainWhitelist.includes(domain)) {
		// exact in whitelist
		return false;
	} else if (domainBlacklist.includes(domain)) {
		// exact in blacklist
		return true;
	} else if (domain.includes('.')) {
		// check next level
		const nextLevel = domain.substring(domain.indexOf('.'));
		return isDomainBlocked(nextLevel);
	}
	// unknown domain
	return false;
}

browser.webRequest.onBeforeRequest.addListener(
	function (requestDetails) {
		const requestDomain = new URL(requestDetails.url).hostname;

		// TODO: make this more efficient
		if (requestDomain) {
			addDomainToSet(requestDomain, 'seenDomains');
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
