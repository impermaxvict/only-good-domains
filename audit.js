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

function drawTree(tree, parent) {
	for (const part in tree) {
		if (tree.hasOwnProperty(part)) {
			const partElement = document.importNode(nodeTemplate.content, true);
			partElement.firstElementChild.dataset.domainPart = part;

			++nodeCounter;
			for (const input of partElement.querySelectorAll('input[type=radio]')) {
				input.name = 'domain-part-' + nodeCounter;
			}

			partElement.querySelector('span').textContent = part;

			drawTree(tree[part], partElement.firstElementChild);
			parent.appendChild(partElement);
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

document.getElementById('domain-tree').addEventListener('submit', function (event) {
	event.preventDefault();

	const tmpWhitelist = [];
	const tmpBlacklist = [];

	const radioButtons = event.currentTarget.querySelectorAll('input[type=radio]:checked');
	for (const radioButton of radioButtons) {
		const domainParts = [];
		let currentPart = radioButton.parentNode;
		while (currentPart.dataset.domainPart) {
			domainParts.push(currentPart.dataset.domainPart);
			currentPart = currentPart.parentNode;
		}
		const fullDomain = domainParts.join('.');

		if (radioButton.value === 'red') {
			tmpBlacklist.push(fullDomain);
		} else if (radioButton.value === 'green') {
			tmpWhitelist.push(fullDomain);
		}
	}

	if (window.confirm('Are you sure to whitelist ' + tmpWhitelist.length + ' and blacklist ' + tmpBlacklist.length + ' domains?')) {
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

	window.location.reload();
});
