'use strict';

function isIPv4Address(subject) {
	if (typeof subject !== 'string') {
		return false;
	}
	const parts = subject.split('.');
	if (parts.length !== 4) {
		return false;
	}
	for (const part of parts) {
		if (!/^\d+$/.test(part)) {
			return false;
		}
		if (!((+part) >= 0 && (+part) <= 255)) {
			return false;
		}
	}
	return true;
}

function sortDomainNameList(domains) {
	const reversed = Array.from(domains).map(domain => domain.split('.').reverse());
	return reversed.sort().map(domain => domain.reverse().join('.'));
}
