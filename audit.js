function buildDomainTree(domains) {
	const tree = {};
	for (const domain of domains) {
		const parts = domain.split('.');
		let parent = tree;
		while (parts.length > 0) {
			const top = parts.pop();
			if (!parent[top]) {
				parent[top] = {};
			}
			parent = parent[top];
		}
	}
	return tree;
}

function auditedDomain(event) {
	const domain = (() => {
		let path = '';
		let current = event.currentTarget.parentNode;
		while (current.dataset.domainPart) {
			path += '.';
			path += current.dataset.domainPart;
			current = current.parentNode;
		}
		if (path !== '') {
			path = path.substring(1);
		}
		return path;
	})();

	const auditResult = event.currentTarget.dataset.auditResult;
	if (auditResult === 'up') {
		event.currentTarget.parentNode.classList.remove('audit-result-down');
		removeDomainFromSet(domain, 'domainBlacklist');
		addDomainToSet(domain, 'domainWhitelist');
		event.currentTarget.parentNode.classList.add('audit-result-up');
	} else if (auditResult === 'down') {
		event.currentTarget.parentNode.classList.remove('audit-result-up');
		removeDomainFromSet(domain, 'domainWhitelist');
		addDomainToSet(domain, 'domainBlacklist');
		event.currentTarget.parentNode.classList.add('audit-result-down');
	}
}

function drawTree(tree, parent) {
	for (const part in tree) {
		if (tree.hasOwnProperty(part)) {
			const partElement = document.createElement('div');
			parent.appendChild(partElement);

			partElement.dataset.domainPart = part;

			const buttonUp = document.createElement('button');
			buttonUp.innerHTML = '&#x1F44D;';
			partElement.appendChild(buttonUp);
			buttonUp.addEventListener('click', auditedDomain);
			buttonUp.dataset.auditResult = 'up';

			const buttonDown = document.createElement('button');
			buttonDown.innerHTML = '&#x1F44E;';
			partElement.appendChild(buttonDown);
			buttonDown.addEventListener('click', auditedDomain);
			buttonDown.dataset.auditResult = 'down';

			const partText = document.createElement('span');
			partText.textContent = part;
			partElement.appendChild(partText);

			drawTree(tree[part], partElement);
		}
	}
}

browser.storage.local.get('seenDomains').then(results => {
	if (results.seenDomains && results.seenDomains.length > 0) {
		const domainTree = buildDomainTree(results.seenDomains);
		drawTree(domainTree, document.getElementById('domain-tree'));
	} else {
		document.body.textContent = 'No domains recorded yet.';
	}
});
