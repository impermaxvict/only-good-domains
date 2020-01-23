'use strict';

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

const nodeTemplate = document.getElementById('domain-tree-node');
let nodeCounter = 0;

function drawTree(tree, parent, parts) {
	for (const part in tree) {
		if (tree.hasOwnProperty(part)) {
			parts.push(part);

			const partElement = document.importNode(nodeTemplate.content, true);
			partElement.firstElementChild.dataset.reverseDomainName = parts.join('.');

			++nodeCounter;
			for (const input of partElement.querySelectorAll('input[type=radio]')) {
				input.name = 'domain-part-' + nodeCounter;
			}

			partElement.querySelector('span').textContent = part;

			drawTree(tree[part], partElement.firstElementChild, parts);
			parent.appendChild(partElement);

			parts.pop();
		}
	}
}

browser.storage.local.get([
	'domainWhitelist',
	'domainBlacklist',
	'seenDomains'
]).then(results => {
	if (results.seenDomains && results.seenDomains.length > 0) {
		const domainTree = buildDomainTree(results.seenDomains);
		drawTree(domainTree, document.getElementById('domain-tree'), []);

		for (const item of document.querySelectorAll('[data-reverse-domain-name]')) {
			const domainName = item.dataset.reverseDomainName.split('.').reverse().join('.');

			if (results.domainWhitelist.includes(domainName)) {
				item.querySelector('[value=green]').checked = true;
			} else if (results.domainBlacklist.includes(domainName)) {
				item.querySelector('[value=red]').checked = true;
			}
		}
	} else {
		document.body.textContent = 'No domains recorded yet.';
	}
});

document.getElementById('save-button').addEventListener('click', function (event) {
	const tmpWhitelist = new Set();
	const tmpBlacklist = new Set();
	const tmpInherited = new Set();

	const radioButtons = document.querySelectorAll('input[type=radio]:checked');
	for (const radioButton of radioButtons) {
		const reverseDomainName = radioButton.parentNode.dataset.reverseDomainName;
		const domainName = reverseDomainName.split('.').reverse().join('.');
		if (radioButton.value === 'red') {
			tmpBlacklist.add(domainName);
		} else if (radioButton.value === 'green') {
			tmpWhitelist.add(domainName);
		} else if (radioButton.value === 'amber') {
			tmpInherited.add(domainName);
		}
	}

	if (tmpWhitelist) {
		browser.storage.local.get('domainWhitelist').then(results => {
			if (results.domainWhitelist) {
				for (const domain of tmpWhitelist) {
					if (!results.domainWhitelist.includes(domain)) {
						results.domainWhitelist.push(domain);
					}
				}

				results.domainWhitelist = results.domainWhitelist.filter(domain => {
					return !(tmpInherited.has(domain) || tmpBlacklist.has(domain));
				});

				browser.storage.local.set({
					domainWhitelist: results.domainWhitelist
				});
			}
		});
	}

	if (tmpBlacklist) {
		browser.storage.local.get('domainBlacklist').then(results => {
			if (results.domainBlacklist) {
				for (const domain of tmpBlacklist) {
					if (!results.domainBlacklist.includes(domain)) {
						results.domainBlacklist.push(domain);
					}
				}

				results.domainBlacklist = results.domainBlacklist.filter(domain => {
					return !(tmpInherited.has(domain) || tmpWhitelist.has(domain));
				});

				browser.storage.local.set({
					domainBlacklist: results.domainBlacklist
				});
			}
		});
	}
});
