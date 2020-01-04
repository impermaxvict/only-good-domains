browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({
		seenDomains: [],
		domainWhitelist: [],
		domainBlacklist: []
	});
});

function isDomainBlocked(domain) {
	return false;
}

browser.webRequest.onBeforeRequest.addListener(
	function (requestDetails) {
		const requestDomain = new URL(requestDetails.url).hostname;

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
