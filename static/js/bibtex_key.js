function generate_bibtex_key(author, year, format, bibliography) {
	// Format is not used for the time being
	var first_author = author.split(' and ')[0]
	if(first_author.length == 0) return false
	if(first_author.index(',') > -1) {
		// The name is in the format 'Smith, Joe'
		first_author = first_author.split(',')[0]
	} else {		
		// The name is in the format 'Joe Smith'
		first_author = first_author.split(' ')[0]
	}
	var key = first_author + year
	var keys = new Array()
	for(entry in bibliography) {
		if(entry['key'].indexOf(key) == 0) {
			// We have something like Smith2013a, Smith2013b...
			keys.push(entry['key'])
		}
	}
}
