function arxiv_save_entry(what) {
	console.log(what)
}

function arxiv_to_bibtex(what) {
	var entry = arxiv[what]
	var bib_str = '@article{' + entry['arxiv_id'] + ',\n'
	var elems = new Array()
	var keys = ['author', 'title', 'journal', 'pages', 'abstract', 'url', 'timestamp']
	for(i in keys) {
		elems.push('\t' + keys[i] + ' = {' + entry[keys[i]] + '}')
	}
	bib_str += elems.join(',\n')
	bib_str += '\n}'
	alert(bib_str)
}
