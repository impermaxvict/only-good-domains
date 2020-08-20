'use strict';

function isIPv4Address(subject) {
	if (typeof subject !== 'string') {
		return false;
	}

	const parts = subject.split('.');
	if (parts.length !== 4) {
		return false;
	}

	let addr = 0;
	try {
		let num;
		for (const part of parts) {
			num = (part) * 1;
			if (num >= 0 && num <= 255) {
				addr <<= 8;
				addr |= (num & 0xFF);
			} else {
				return false;
			}
		}
	} catch (error) {
		return false;
	}
	console.log('IPv4', subject, addr);

	return true;
}

function sortDomainNameList(domains) {
	const reversed = Array.from(domains).map(domain => domain.split('.').reverse());
	return reversed.sort().map(domain => domain.reverse().join('.'));
}
