var calculator_history = []
var calculator_result = null
var chi = 0
var parser = math.parser()

function eval_calculator(event) {
	if(event.which === 13) {
		var math_expression = $('#calculator_string').val()
		if(math_expression.length == 0) return false
		calculator_history.push(math_expression)
		chi = calculator_history.length
		calculator_result = parser.eval(math_expression)
		$('#calculator_result').html(
			$('#calculator_result').html() + '<font color="#aa0000">' + math_expression + '</font><br>&nbsp;&nbsp;&nbsp;<font color="#000099">' + calculator_result + '</font><br>'
		)
		$('#calculator_string').val('')
		$('#calculator_result').scrollTop(200);
		return false
	} 
	else if(event.which === 38) { // Up arrow
		if(chi > 0) {
			chi--
			$('#calculator_string').val(calculator_history[chi])
			return false
		}
	}
	else if(event.which === 40) { // Down arrow
		if(chi < calculator_history.length) {
			chi++
			$('#calculator_string').val(calculator_history[chi])
			return false
		}
	}
	return true
}

function insert_calculator_result() {
	document.execCommand('insertText', false, calculator_result)
}

function insert_calculator_expression() {
	document.execCommand('insertText', false, calculator_history[calculator_history.length-1] + '=' + calculator_result)
}


$(function() {
	$('#calculator_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	false,
		height:		400,
		width:		400,
		modal:		true,
		title:		'Calculator scratch pad',
		draggable:	true,
		hide:		'fade',
		buttons:	{
			'Insert result' : function(){ insert_calculator_result() },
			'Insert expression' : function(){ insert_calculator_expression() },
			'Cancel' : function(){ $(this).dialog('close')}
		}
	});
});

function open_calculator() {
	$('#calculator_dialog').dialog('open')
}
