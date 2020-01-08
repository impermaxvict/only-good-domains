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

function loadPreviousState() {
	browser.storage.local.get('domainWhitelist').then(results => {
		for (const domain of results.domainWhitelist) {
			const reverse = domain.split('.').reverse().join('.');
			const selector = '[data-reverse-domain-name="' + reverse + '"] > [value=green]';
			document.querySelector(selector).checked = true;
		}
	});

	browser.storage.local.get('domainBlacklist').then(results => {
		for (const domain of results.domainBlacklist) {
			const reverse = domain.split('.').reverse().join('.');
			const selector = '[data-reverse-domain-name="' + reverse + '"] > [value=red]';
			document.querySelector(selector).checked = true;
		}
	});
}

browser.storage.local.get('seenDomains').then(results => {
	if (results.seenDomains && results.seenDomains.length > 0) {
		const domainTree = buildDomainTree(results.seenDomains);
		drawTree(domainTree, document.getElementById('domain-tree'), []);

		loadPreviousState();
	} else {
		document.body.textContent = 'No domains recorded yet.';
	}
});

document.getElementById('domain-tree').addEventListener('submit', function (event) {
	event.preventDefault();

	const tmpWhitelist = [];
	const tmpBlacklist = [];

	const radioButtons = event.currentTarget.querySelectorAll('input[type=radio]:checked');
	for (const radioButton of radioButtons) {
		const reverseDomainName = radioButton.parentNode.dataset.reverseDomainName;
		const domainName = reverseDomainName.split('.').reverse().join('.');
		if (radioButton.value === 'red') {
			tmpBlacklist.push(domainName);
		} else if (radioButton.value === 'green') {
			tmpWhitelist.push(domainName);
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
				browser.storage.local.set({
					domainBlacklist: results.domainBlacklist
				});
			}
		});
	}
});
