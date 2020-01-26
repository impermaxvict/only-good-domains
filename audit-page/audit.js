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

function drawTree(tree, parent, parts, whitelist, blacklist) {
	for (const part in tree) {
		if (tree.hasOwnProperty(part)) {
			parts.push(part);

			const partNode = document.importNode(nodeTemplate.content, true);
			const partElement = partNode.firstElementChild;
			partElement.dataset.reverseDomainName = parts.join('.');

			++nodeCounter;
			const btnRed = partElement.querySelector('[value=red]');
			btnRed.name = 'domain-part-' + nodeCounter;
			const btnAmber = partElement.querySelector('[value=amber]');
			btnAmber.name = 'domain-part-' + nodeCounter;
			const btnGreen = partElement.querySelector('[value=green]');
			btnGreen.name = 'domain-part-' + nodeCounter;

			let domainName = partElement.dataset.reverseDomainName;
			domainName = domainName.split('.').reverse().join('.');
			if (whitelist.has(domainName)) {
				btnGreen.checked = true;
			} else if (blacklist.has(domainName)) {
				btnRed.checked = true;
			} else {
				btnAmber.checked = true;
			}

			partElement.querySelector('span').textContent = part;

			drawTree(tree[part], partElement, parts, whitelist, blacklist);
			parent.appendChild(partNode);

			parts.pop();
		}
	}
}

browser.storage.local.get([
	'domainWhitelist',
	'domainBlacklist',
	'seenDomains'
]).then(({
	domainWhitelist,
	domainBlacklist,
	seenDomains
}) => {
	if (seenDomains && seenDomains.length > 0) {
		const domainTree = buildDomainTree(seenDomains);
		const whitelist = new Set(domainWhitelist);
		const blacklist = new Set(domainBlacklist);

		const domainTreeContainer = document.getElementById('domain-tree');
		drawTree(domainTree, domainTreeContainer, [], whitelist, blacklist);
		domainTreeContainer.style.display = 'block';
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

	const counter = tmpWhitelist.size + tmpBlacklist.size + tmpInherited.size;
	window.alert('Saving changes to ' + counter + ' domains.');

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
