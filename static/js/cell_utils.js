function copy_cells() {
	
}

function toc_link_onclick(event) {
	console.log('target: ' + event.target + ' + ' + event.which)
	if(event.ctrlKey) {
			console.log('CNTRL')
			event.stopPropagation()
			return true
	}
	return false
}

$(document).ready(function () {
	
})
