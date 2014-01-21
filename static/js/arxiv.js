function arxiv_save_entry(what) {
	console.log(arxiv_to_bibtex(what))
}

function arxiv_to_bibtex(what) {
	var entry = arxiv[what]
	var elems = new Array()
	var keys = ['author', 'title', 'journal', 'pages', 'abstract', 'url', 'timestamp']
	for(i in keys) {
		elems.push('\t' + keys[i] + ' = {' + entry[keys[i]] + '}')
	}
	return '@article{' + entry['arxiv_id'] + ',\n' + elems.join(',\n') + '\n}'
}
