function addDomainToSet(domain, name) {
	browser.storage.local.get(name).then(results => {
		if (!results[name].includes(domain)) {
			results[name].push(domain);
			browser.storage.local.set(results);
		}
	});
}

function removeDomainFromSet(domain, name) {
	browser.storage.local.get(name).then(results => {
		const index = results[name].indexOf(domain);
		if (index !== -1) {
			delete results[name][index];
			browser.storage.local.set(results);
		}
	});
}

function sortDomainList(domains) {
	const reversed = [];
	for (const domain of domains) {
		if (domain) {
			reversed.push(domain.split('.').reverse().join('.'));
		}
	}
	reversed.sort();
	const sorted = [];
	for (const domain of reversed) {
		sorted.push(domain.split('.').reverse().join('.'));
	}
	return sorted;
}
