document.getElementById('btn-audit-domains').addEventListener('click', function () {
	browser.tabs.create({
		url: "/audit.html"
	});
});

document.getElementById('btn-download-whitelist').addEventListener('click', function (event) {
	browser.storage.local.get('domainWhitelist').then(results => {
		const link = document.createElement('a');
		link.download = 'whitelist.txt';
		const content = sortDomainList(results.domainWhitelist).join('\n') + '\n';
		link.href = 'data:text/plain,' + encodeURIComponent(content);
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});

document.getElementById('btn-download-blacklist').addEventListener('click', function () {
	browser.storage.local.get('domainBlacklist').then(results => {
		const link = document.createElement('a');
		link.download = 'blacklist.txt';
		const content = sortDomainList(results.domainBlacklist).join('\n') + '\n';
		link.href = 'data:text/plain,' + encodeURIComponent(content);
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});

document.getElementById('btn-download-hosts-file').addEventListener('click', function () {
	browser.storage.local.get('domainBlacklist').then(results => {
		const sorted = sortDomainList(results.domainBlacklist);
		let content = '';
		for (const domain of sorted) {
			content += '0.0.0.0\t' + domain + '\n';
		}

		const link = document.createElement('a');
		link.download = 'hosts.txt';
		link.href = 'data:text/plain,' + encodeURIComponent(content);
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
});
