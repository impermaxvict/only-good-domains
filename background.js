'use strict';

// Initialize local storage
browser.storage.local.get().then(results => {
	let changed = false;

	if (!results.domainWhitelist) {
		results.domainWhitelist = [];
		changed = true;
	}

	if (!results.domainBlacklist) {
		results.domainBlacklist = [];
		changed = true;
	}

	if (!results.seenDomains) {
		results.seenDomains = [];
		changed = true;
	}

	if (changed) {
		browser.storage.local.set(results);
	}
});

let domainWhitelist = new Set();
let domainBlacklist = new Set();
let seenDomains = new Set();

browser.storage.local.get([
	'domainWhitelist',
	'domainBlacklist',
	'seenDomains'
]).then(results => {
	if (results.domainWhitelist) {
		domainWhitelist = new Set(results.domainWhitelist);
	}

	if (results.domainBlacklist) {
		domainBlacklist = new Set(results.domainBlacklist);
	}

	if (results.seenDomains) {
		seenDomains = new Set(results.seenDomains);
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

const unsavedDomainNames = new Set();
let updateTimer;

async function recordDomainName(domainName) {
	if (isIPv4Address(domainName)) {
		return;
	}

	// TODO: Ignore IPv6 addresses

	if (!seenDomains.has(domainName)) {
		seenDomains.add(domainName);

		unsavedDomainNames.add(domainName);

		if (!updateTimer) {
			updateTimer = setTimeout(function () {
				browser.storage.local.get('seenDomains').then(results => {
					for (const unsavedDomainName of unsavedDomainNames) {
						if (!results.seenDomains.includes(unsavedDomainName)) {
							results.seenDomains.push(unsavedDomainName);
						}
					}
					browser.storage.local.set(results);

					unsavedDomainNames.clear();
				});

				clearTimeout(updateTimer);
				updateTimer = null;
			}, 3000);
		}
	}
}

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
		if (requestDomain && !isIPv4Address(requestDomain)) {
			recordDomainName(requestDomain);

			if (isDomainBlocked(requestDomain)) {
				return {
					'cancel': true
				};
			}
		}
	}, {
		urls: ["<all_urls>"]
	},
	["blocking"]
);
