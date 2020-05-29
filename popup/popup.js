'use strict';

document.getElementById('btn-audit-domains').addEventListener('click', function () {
	browser.tabs.create({
		url: "/audit-page/audit.html"
	});
});

async function downloadAsFile(filename, type, content) {
	const link = document.createElement('a');
	link.download = filename;
	link.href = 'data:' + type + ',' + encodeURIComponent(content);
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

async function assembleLists() {
	const results = await browser.storage.local.get([
		'domainWhitelist',
		'domainBlacklist',
		'seenDomains'
	]);

	const whitelist = new Set(results.domainWhitelist);
	const blacklist = new Set(results.domainBlacklist);

	for (const domainName of results.seenDomains) {
		if (!whitelist.has(domainName) && !blacklist.has(domainName)) {
			let ancestorFound = false;
			const parts = domainName.split('.');
			const lower = [];
			while (!ancestorFound && parts.length > 0) {
				lower.push(parts.shift());
				const upper = parts.join('.');
				if (whitelist.has(upper) || blacklist.has(upper)) {
					ancestorFound = true;
				}
			}

			if (ancestorFound) {
				const ancestorDomain = parts.join('.');
				if (whitelist.has(ancestorDomain)) {
					while (lower.length > 0) {
						parts.unshift(lower.pop());
						whitelist.add(parts.join('.'));
					}
				} else if (blacklist.has(ancestorDomain)) {
					while (lower.length > 0) {
						parts.unshift(lower.pop());
						blacklist.add(parts.join('.'));
					}
				}
			}
		}
	}

	return {
		whitelist: sortDomainNameList(whitelist),
		blacklist: sortDomainNameList(blacklist)
	};
}

document.getElementById('btn-download-whitelist').addEventListener('click', function () {
	assembleLists().then(({
		whitelist
	}) => {
		downloadAsFile('whitelist.txt', 'text/plain', whitelist.join('\n') + '\n');
	});
});

document.getElementById('btn-download-blacklist').addEventListener('click', function () {
	assembleLists().then(({
		blacklist
	}) => {
		downloadAsFile('blacklist.txt', 'text/plain', blacklist.join('\n') + '\n');
	});
});
