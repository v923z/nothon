$(document).ready(function () {
	console.log('here')
	$(function(){
		$('#publication_list').tablesorter({
			widgets        : ['zebra', 'resizable'],
			usNumberFormat : false,
			sortReset      : true,
			sortRestart    : true
		});
	});
})

//function bibliography_side_switch() {
	//if($('#aside').css('display') == 'block') {
		//$('#aside').css('display', 'none')
		//// TODO: find out how to retrieve default properties
		//$('#article').css('width', '98%')
		//$('#aside_switch').html('>>')
	//}
	//else {
		//$('#aside').css('display', 'block')
		//$('#article').css('width', '78%')
		//$('#aside_switch').html('<<')
	//}
//}


