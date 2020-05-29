'use strict';

function buildDomainTree(domains) {
	const tree = {};
	for (const domain of domains) {
		if (isIPv4Address(domain)) {
			continue;
		}

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

			const nodeName = 'domain-part-' + (++nodeCounter);
			const btnRed = partElement.querySelector('[value=red]');
			btnRed.name = nodeName;
			const btnAmber = partElement.querySelector('[value=amber]');
			btnAmber.name = nodeName;
			const btnGreen = partElement.querySelector('[value=green]');
			btnGreen.name = nodeName;

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

			parent.appendChild(partNode);

			if (Object.keys(tree[part]).length > 0) {
				const subdomainListElement = document.createElement('ul');
				subdomainListElement.classList.add('subdomains');
				partElement.appendChild(subdomainListElement);

				drawTree(tree[part], subdomainListElement, parts, whitelist, blacklist);

				partElement.classList.add('subdomain-list');
				partElement.querySelector('span').addEventListener('click', function () {
					this.parentElement.classList.toggle('expanded');
				});
			}

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
		seenDomains = sortDomainNameList(seenDomains);
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
	if (!window.confirm('Saving changes to ' + counter + ' domains.')) {
		return;
	}

	browser.storage.local.get([
		'domainWhitelist',
		'domainBlacklist'
	]).then(({
		domainWhitelist,
		domainBlacklist
	}) => {
		for (const domain of tmpWhitelist) {
			if (!domainWhitelist.includes(domain)) {
				domainWhitelist.push(domain);
			}
		}

		domainWhitelist = domainWhitelist.filter(domain => {
			return !(tmpInherited.has(domain) || tmpBlacklist.has(domain));
		});

		for (const domain of tmpBlacklist) {
			if (!domainBlacklist.includes(domain)) {
				domainBlacklist.push(domain);
			}
		}

		domainBlacklist = domainBlacklist.filter(domain => {
			return !(tmpInherited.has(domain) || tmpWhitelist.has(domain));
		});

		browser.storage.local.set({
			domainWhitelist,
			domainBlacklist
		});
	});
});
