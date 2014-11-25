function insert_section() {
	var id = generate_cell_id()
	insert_new_cell(section_html(id), 'div_section_header_' + id)
	section_context_menu()
	return false
}


function section_context_menu() {
	var menu = '<div class="context_menu_header">Section</div>\
		<ul class="context_menu_list">\
		<li alt="insertUnorderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Unordered list</li>\
		<li alt="insertOrderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Ordered list</li>\
		<li alt="link" onmouseup="return create_link();" onmousedown="return false;">Link</li>\
		<li alt="math" onmouseup="return edit_math();" onmousedown="return false;">Math</li>\
		<li alt="bold" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><b>Bold</b></li>\
		<li alt="italic" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><i>Italic</i></li>\
		<li alt="underline" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><u>Underline</u></li>\
		<li alt="strikeThrough" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Strikethrough</li>\
		<li alt="hilitecolor" onmouseup="return highlight();" onmousedown="return false;">Highlight</li>\
		<li alt="indent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Indent</li>\
		<li alt="outdent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Outdent</li>\
		<li onmouseup="return insert_date();" onmousedown="return false;">Date</li>\
		<li onmouseup="return insert_image();" onmousedown="return false;">Image</li>\
		<li onmouseup="return insert_note();" onmousedown="return false;">Note</li>\
		<li alt="insertHorizontalRule" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Line</li>\
		<hr>\
		<li alt="raw" onmouseup="strip_mathjax(active_div); return false;">Raw content</li>\
		<li alt="lock" onmouseup="return lock_cell(active_div);">Lock cell</li>\
		<li alt="new" onmousedown="return false;" onmouseup="return insert_text();">New text cell</li>\
		<li alt="copy" onmousedown="return false;" onmouseup="return copy_text_cell();">Copy cell</li>\
		<li onmousedown="return false;" onmouseup="return popout_cell()">Pop out cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}


function section_onclick(target) {
}

function section_sanitise(block) {
	var dtemp = $('<div/>', {'id': 'dtemp'}).appendTo('#trash')
	// We have to remove all codemirror and editor instances
	$('#dtemp').html(block.content.section_body.content)
	remove_rendered_math($('#dtemp'))
	strip_images_for_save($('#dtemp'))
	block.content.section_body.content = $('#dtemp').html()
	block.content.section_header.content = block.content.section_header.content.replace('<br>', '')
	$('#dtemp').remove()
	return block
}

function remove_rendered_math(target) {
	$(target).find('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
	$(target).find('.math_editor').each( function() { 
		$(this).remove()
		//var main = $(this).data('main')
		//console.log($(this).attr('id'))
		//$('#' + main).find('#' + $(this).attr('id')).each( function() {
			////var editor = $(this).attr('data-editor')
			////console.log(editor.getTextArea().id)
		//})
		//$('#' + main + ' #' + $(this).data('formula_id')).attr('alt', editor.getValue().replace(/\\/g, '\\'))
	})
	$(target).find('.CodeMirror').each( function() { $(this).remove() })
}

function section_html(count) {
	var $main = $('<div></div>').addClass('main section_main')
			.attr({'id': 'div_section_main_' + count, 
				'data-type': 'section', 
				'data-count': count
			}).data({'sanitise': function(block) { 
					return section_sanitise(block) 
				}
			})
	$('<div></div>').appendTo($main).addClass('button_expand')
	.attr('id', 'expand_div_section_main_' + count)
	.click(function(event) { section_onclick(event) })
	
	$('<div></div>').appendTo($main).addClass('section_header')
	.attr({'id': 'div_section_header_' + count, 
		'contenteditable': true,
		'data-type': 'section',
		'data-save': true,
		'data-toc': true,
		'data-searchable': true, 
		'data-main': 'div_section_main_' + count,
		'data-count': count
	}).data({'menu': function() { 
				section_context_menu() 
			}
	})
	.click(function(event) { section_onclick(event) })
	.focus(function() { set_active('div_section_header_' + count) })
	
	$('<div></div>').appendTo($main).addClass('section_body')
	.attr({'id': 'div_section_body_' + count, 
		'contenteditable': true,
		'data-type': 'section',
		'data-save': true,
		'data-toc': true,
		'data-searchable': true, 
		'data-main': 'div_section_main_' + count,
		'data-count': count
	}).data({'menu': function() { 
				section_context_menu() 
			}
	})
	.click(function(event) { section_onclick(event) })
	.focus(function() { set_active('div_section_body_' + count) })

	return $main
}

function section_render(json) {
	add_new_cell(section_html(json.count))
	$('#div_section_header_' + json.count).html(json.content.section_header.content)
	$('#div_section_body_' + json.count).html(json.content.section_body.content)
}

function edit_math() {
	var $target = get_active_cell()
	$target.find('.nothon_math').each( function() {
		if($(this).is('span')) {
			// Do nothing here
		} else if($(this).is('div')) {
			var id = $(this).attr('id') || 'math_' + generate_cell_id()
			$(this).attr('id', id)
			if($(this).attr('alt') !== '') {
				if($('#textarea_math_editor_' + id).length == 0) {
					$(this).after(math_editor_html(id))
					var editor = math_editor('textarea_math_editor_' + id)
					$('#textarea_math_editor_' + id).data({'editor': editor})
					editor.setValue($(this).attr('alt'))
				} else {
					//var editor = $('#textarea_math_editor_' + id).data('editor')
					//editor.getWrapperElement().style.display = 'block'
					// TODO: Move the cursor to the editor
				}
			}
		}
	})
	return false
}

function math_editor_html(id) {
	var $edit = $('<textarea></textarea>').addClass('math_editor')
	.attr({'id': 'textarea_math_editor_' + id,
		'data-formula_id': id,
		'data-type': 'math-edit',
		'data-count': id, 
		'data-save': false, 
		'data-searchable': false,
		'data-main': get_active_main().attr('id')})
	.focus(function(){})
	
	return $edit
}

function math_editor(id) {
	var editor = CodeMirror.fromTextArea(document.getElementById(id), {
			lineNumbers: false,
			mode: 'stex',
			matchBrackets: true,
			extraKeys: {
				"Ctrl-K" : "toggleComment",
				'Ctrl-Enter' : function(cm) { 
						render_math(cm)
					},
				'Shift-Enter' : function(cm) { 
						render_math(cm)
						// If we remove the editor, changes won't persist!
						var $ta = $('#' + cm.getTextArea().id)
						cm.toTextArea()
						$ta.remove()
					}
			},
			autoCloseBrackets: "()[]{}"
		})
	editor.on('cursorActivity', function(cm) { cursor_activity(cm) })
	return editor
}

function render_math(cm) {
	var formula_id = $('#' + cm.getTextArea().id).data('formula_id')
	var main = $('#' + cm.getTextArea().id).data('main')
	$('#' + formula_id).attr('alt', cm.getValue().replace(/\\/g, '\\'))
	$('#' + formula_id).html(cm.getValue().replace(/\\/g, '\\'))
	MathJax.Hub.Queue(resetEquationNumbers, 
		//["PreProcess", MathJax.Hub, main],
		["Reprocess", MathJax.Hub, main]);
}

function cursor_activity(cm) {
	var formula_id = $('#' + cm.getTextArea().id).data('formula_id')
	var pos = cm.getCursor()
	var lines = cm.getValue().replace(/\\/g, '\\').split('\n')
	var line = lines[pos.line]
	var char = line[pos.ch]
	// If special character, do not render
	if($.inArray(char, ['{', '}', '^', '_' ]) > -1) return
	var new_line = coloured_latex(line, pos.ch)
	if(!new_line) return
	lines[pos.line] = new_line
	console.log(lines[pos.line])
	$('#' + formula_id).html(lines.join('\n'))
	// We have to do some display swapping here, otherwise, the 
	// display is somewhat jerky
	MathJax.Hub.Queue(resetEquationNumbers, 
		["PreProcess", MathJax.Hub, formula_id],
		["Reprocess", MathJax.Hub, formula_id]);
}

function coloured_latex(line, pos) {
	if(line.indexOf('\\begin{') > -1 || line.indexOf('\\end{') > -1) {
		// We should not do anything, if we are in a line of beginning 
		// or ending an environment
		return null
	}
	
	var latex_commands = new Array()
	
	latex_commands = ['\\aleph', '\\alpha', '\\amalg', '\\angle', '\\approx', 
	'\\approxeq', '\\arccos', '\\arcsin', '\\arctan', '\\arg',  
	'\\Arrowvert', '\\arrowvert', '\\ast', '\\asymp',  
	'\\backepsilon', '\\backprime', '\\backsim', '\\backsimeq', '\\backslash', 
	'\\bar', '\\barwedge', '\\Bbb', '\\Bbbk', '\\because', 
	'\\beta', '\\beth', '\\between', '\\bigcap', '\\bigcirc', '\\bigcup',   
	'\\bigodot', '\\bigoplus', '\\bigotimes', 
	'\\bigsqcup', '\\bigstar', '\\bigtriangledown', '\\bigtriangleup', 
	'\\biguplus', '\\bigvee', '\\bigwedge', '\\binom', '\\blacklozenge', 
	'\\blacksquare', '\\blacktriangle', '\\blacktriangledown', '\\blacktriangleleft', 
	'\\blacktriangleright', '\\bmod', '\\boldsymbol', '\\bot', '\\bowtie', '\\Box', 
	'\\boxdot', '\\boxminus', '\\boxplus', '\\boxtimes', '\\brace', 
	'\\bracevert', '\\brack', '\\breve', '\\buildrel', '\\bullet', '\\Bumpeq', 
	'\\bumpeq', '\\cal', '\\cap', '\\Cap', '\\cases', 
	'\\cdot', '\\cdotp', '\\cdots', '\\ce', '\\cee', '\\centerdot', '\\cf', 
	'\\cfrac', '\\check', '\\checkmark', '\\chi', '\\choose', '\\circ', '\\circeq', 
	'\\circlearrowleft', '\\circlearrowright', '\\circledast', '\\circledcirc', 
	'\\circleddash', '\\circledR', '\\circledS', '\\class', '\\clubsuit', '\\colon', 
	'\\complement', '\\cong', '\\coprod', '\\cos', '\\cosh', 
	'\\cot', '\\coth', '\\cr', '\\csc', '\\cssId', '\\cup', '\\Cup', '\\curlyeqprec', 
	'\\curlyeqsucc', '\\curlyvee', '\\curlywedge', '\\curvearrowleft', '\\curvearrowright', 
	'\\dagger', '\\daleth', '\\dashleftarrow', '\\dashrightarrow', '\\dashv', '\\dbinom', 
	'\\ddagger', '\\ddddot', '\\dddot', '\\ddot', '\\ddots', '\\DeclareMathOperator', 
	'\\deg', '\\Delta', '\\delta', '\\det', '\\dfrac', 
	'\\diagdown', '\\diagup', '\\diamond', '\\Diamond', '\\diamondsuit', '\\digamma', 
	'\\dim', '\\displaylines', '\\displaystyle', '\\div', '\\divideontimes', '\\dot', 
	'\\doteq', '\\Doteq', '\\doteqdot', '\\dotplus', '\\dots', '\\dotsb', '\\dotsc', 
	'\\dotsi', '\\dotsm', '\\dotso', '\\doublebarwedge', '\\doublecap', '\\doublecup', 
	'\\Downarrow', '\\downarrow', '\\downdownarrows', '\\downharpoonleft', 
	'\\downharpoonright', '\\ell', '\\emptyset', '\\enclose', '\\end', '\\endgroup', 
	'\\enspace', '\\epsilon', '\\eqalign', '\\eqalignno', '\\eqcirc', '\\eqref', 
	'\\eqsim', '\\eqslantgtr', '\\eqslantless', '\\equiv', '\\eta', '\\eth', '\\exists', 
	'\\exp', '\\fallingdotseq', '\\fbox', '\\fcolorbox', '\\Finv', '\\flat', '\\forall', 
	'\\frac', '\\frac', '\\frak', '\\frown', '\\Game', '\\Gamma', '\\gamma', '\\gcd', 
	'\\gdef', '\\ge', '\\genfrac', '\\geq', '\\geqq', '\\geqslant', '\\gets', '\\gg', 
	'\\ggg', '\\gggtr', '\\gimel', '\\global', '\\gnapprox', '\\gneq', '\\gneqq', 
	'\\gnsim', '\\grave', '\\gt', '\\gt', '\\gtrapprox', '\\gtrdot', '\\gtreqless', 
	'\\gtreqqless', '\\gtrless', '\\gtrsim', '\\gvertneqq', '\\hat', '\\hbar', '\\hbox', 
	'\\hdashline', '\\heartsuit', '\\hline', '\\hom', '\\hookleftarrow', 
	'\\hookrightarrow', '\\hphantom', '\\href', '\\hskip', '\\hslash', '\\hspace', 
	'\\Huge', '\\huge', '\\idotsint', '\\iff', '\\iiiint', '\\iiint', '\\iint', 
	'\\Im', '\\imath', '\\impliedby', '\\implies', '\\in', '\\inf', '\\infty', 
	'\\injlim', '\\int', '\\intercal', '\\intop', '\\iota', '\\it', '\\jmath', 
	'\\Join', '\\kappa', '\\ker', '\\kern', '\\label', '\\Lambda', '\\lambda', 
	'\\land', '\\langle', '\\LARGE', '\\Large', '\\large', '\\LaTeX', '\\lbrace', 
	'\\lbrack', '\\lceil', '\\ldotp', '\\ldots', '\\le', '\\leadsto', '\\left', 
	'\\Leftarrow', '\\leftarrow', '\\leftarrowtail', '\\leftharpoondown', 
	'\\leftharpoonup', '\\leftleftarrows', '\\Leftrightarrow', '\\leftrightarrow', 
	'\\leftrightarrows', '\\leftrightharpoons', '\\leftrightsquigarrow', '\\leftroot', 
	'\\leftthreetimes', '\\leq', '\\leqalignno', '\\leqq', '\\leqslant', '\\lessapprox', 
	'\\lessdot', '\\lesseqgtr', '\\lesseqqgtr', '\\lessgtr', '\\lesssim', '\\let', 
	'\\lfloor', '\\lg', '\\lgroup', '\\lhd', '\\lim', '\\liminf', '\\limits', '\\limsup', 
	'\\ll', '\\llap', '\\llcorner', '\\Lleftarrow', '\\lll', '\\llless', '\\lmoustache', 
	'\\ln', '\\lnapprox', '\\lneq', '\\lneqq', '\\lnot', '\\lnsim', '\\log', '\\Longleftarrow', 
	'\\longleftarrow', '\\Longleftrightarrow', '\\longleftrightarrow', '\\longmapsto', 
	'\\Longrightarrow', '\\longrightarrow', '\\looparrowleft', '\\looparrowright', '\\lor', 
	'\\lower', '\\lozenge', '\\lrcorner', '\\Lsh', '\\lt', '\\lt', '\\ltimes', '\\lVert', 
	'\\lvert', '\\lvertneqq', '\\maltese', '\\mapsto', '\\mathbb', '\\mathbf', '\\mathbin', 
	'\\mathcal', '\\mathchoice', '\\mathclose', '\\mathfrak', '\\mathinner', '\\mathit', 
	'\\mathop', '\\mathopen', '\\mathord', '\\mathpunct', '\\mathrel', '\\mathring', 
	'\\mathrm', '\\mathscr', '\\mathsf', '\\mathstrut', '\\mathtip', '\\mathtt', '\\matrix', 
	'\\max', '\\mbox', '\\measuredangle', '\\mho', '\\mid', '\\middle', '\\min', '\\mit', 
	'\\mkern', '\\mmlToken', '\\mod', '\\models', '\\moveleft', '\\moveright', '\\mp', 
	'\\mskip', '\\mspace', '\\mu', '\\multimap', '\\nabla', '\\natural', '\\ncong', '\\ne', 
	'\\nearrow', '\\neg', '\\negmedspace', '\\negthickspace', '\\negthinspace', '\\neq', 
	'\\newcommand', '\\newenvironment', '\\Newextarrow', '\\newline', '\\nexists', '\\ngeq', 
	'\\ngeqq', '\\ngeqslant', '\\ngtr', '\\ni', '\\nLeftarrow', '\\nleftarrow', '\\nLeftrightarrow', 
	'\\nleftrightarrow', '\\nleq', '\\nleqq', '\\nleqslant', '\\nless', '\\nmid', '\\nobreakspace', 
	'\\nolimits', '\\normalsize', '\\not', '\\notag', '\\notin', '\\nparallel', '\\nprec', 
	'\\npreceq', '\\nRightarrow', '\\nrightarrow', '\\nshortmid', '\\nshortparallel', '\\nsim', 
	'\\nsubseteq', '\\nsubseteqq', '\\nsucc', '\\nsucceq', '\\nsupseteq', '\\nsupseteqq', 
	'\\ntriangleleft', '\\ntrianglelefteq', '\\ntriangleright', '\\ntrianglerighteq', '\\nu', 
	'\\nVDash', '\\nVdash', '\\nvDash', '\\nvdash', '\\nwarrow', '\\odot', '\\oint', '\\oldstyle', 
	'\\Omega', '\\omega', '\\omicron', '\\ominus', '\\operatorname', '\\oplus', '\\oslash', 
	'\\otimes', '\\over',  '\\overwithdelims', '\\owns', '\\parallel', '\\partial', 
	'\\perp', '\\phantom', '\\Phi', '\\phi', '\\Pi', '\\pi', '\\pitchfork', '\\pm', '\\pmatrix', 
	'\\pmb', '\\pmod', '\\pod', '\\Pr', '\\prec', '\\precapprox', '\\preccurlyeq', '\\preceq', 
	'\\precnapprox', '\\precneqq', '\\precnsim', '\\precsim', '\\prime', '\\prod', '\\projlim', 
	'\\propto', '\\Psi', '\\psi', '\\qquad', '\\quad', '\\raise', '\\rangle', '\\rbrace', 
	'\\rbrack', '\\rceil', '\\Re', '\\ref', '\\renewcommand', '\\renewenvironment', '\\require', 
	'\\restriction', '\\rfloor', '\\rgroup', '\\rhd', '\\rho', '\\right', '\\Rightarrow', 
	'\\rightarrow', '\\rightarrowtail', '\\rightharpoondown', '\\rightharpoonup', '\\rightleftarrows', 
	'\\rightleftharpoons', '\\rightleftharpoons', '\\rightrightarrows', '\\rightsquigarrow', 
	'\\rightthreetimes', '\\risingdotseq', '\\rlap', '\\rm', '\\rmoustache', '\\root', 
	'\\Rrightarrow', '\\Rsh', '\\rtimes', '\\Rule', '\\rVert', '\\rvert', '\\S', '\\scr', 
	'\\scriptscriptstyle', '\\scriptsize', '\\scriptstyle', '\\searrow', '\\sec', '\\setminus', 
	'\\sf', '\\sharp', '\\shortmid', '\\shortparallel', '\\shoveleft', '\\shoveright', '\\sideset', 
	'\\Sigma', '\\sigma', '\\sim', '\\simeq', '\\sin', '\\sinh', '\\skew', '\\small', '\\smallfrown', 
	'\\smallint', '\\smallsetminus', '\\smallsmile', '\\smash', '\\smile', '\\Space', '\\space', 
	'\\spadesuit', '\\sphericalangle', '\\sqcap', '\\sqcup', '\\sqrt', '\\sqsubset', '\\sqsubseteq', 
	'\\sqsupset', '\\sqsupseteq', '\\square', '\\stackrel', '\\star', '\\strut', '\\style', '\\subset', 
	'\\Subset', '\\subseteq', '\\subseteqq', '\\subsetneq', '\\subsetneqq', '\\substack', '\\succ', 
	'\\succapprox', '\\succcurlyeq', '\\succeq', '\\succnapprox', '\\succneqq', '\\succnsim', '\\succsim', 
	'\\sum', '\\sup', '\\supset', '\\Supset', '\\supseteq', '\\supseteqq', '\\supsetneq', '\\supsetneqq', 
	'\\surd', '\\swarrow', '\\tag', '\\tan', '\\tanh', '\\tau', '\\tbinom', '\\TeX', '\\text', '\\textbf', 
	'\\textit', '\\textrm', '\\textstyle', '\\texttip', '\\tfrac', '\\therefore', '\\Theta', '\\theta', 
	'\\thickapprox', '\\thicksim', '\\thinspace', '\\tilde', '\\times', '\\tiny', '\\Tiny', '\\to', 
	'\\toggle', '\\top', '\\triangle', '\\triangledown', '\\triangleleft', '\\trianglelefteq', 
	'\\triangleq', '\\triangleright', '\\trianglerighteq', '\\tt', '\\twoheadleftarrow', 
	'\\twoheadrightarrow', '\\ulcorner',  '\\unicode', '\\unlhd', '\\unrhd', '\\Uparrow', 
	'\\uparrow', '\\Updownarrow', '\\updownarrow', '\\upharpoonleft', '\\upharpoonright', '\\uplus', 
	'\\uproot', '\\Upsilon', '\\upsilon', '\\upuparrows', '\\urcorner', '\\varDelta', '\\varepsilon', 
	'\\varGamma', '\\varinjlim', '\\varkappa', '\\varLambda', '\\varliminf', '\\varlimsup', 
	'\\varnothing', '\\varOmega', '\\varphi', '\\varPhi', '\\varpi', '\\varPi', '\\varprojlim', 
	'\\varpropto', '\\varPsi', '\\varrho', '\\varsigma', '\\varSigma', '\\varsubsetneq', 
	'\\varsubsetneqq', '\\varsupsetneq', '\\varsupsetneqq', '\\vartheta', '\\varTheta', 
	'\\vartriangle', '\\vartriangleleft', '\\vartriangleright', '\\varUpsilon', '\\varXi', 
	'\\vcenter', '\\vdash', '\\Vdash', '\\vDash', '\\vdots', '\\vec', '\\vee', '\\veebar', 
	'\\verb', '\\Vert', '\\vert', '\\vphantom', '\\Vvdash', '\\wedge', '\\widehat', '\\widetilde', 
	'\\wp', '\\wr', '\\Xi', '\\xi', '\\xcancel', '\\xleftarrow', '\\xlongequal', '\\xmapsto', 
	'\\xrightarrow', '\\xtofrom', '\\xtwoheadleftarrow', '\\xtwoheadrightarrow', '\\yen', '\\zeta']
	
	for(i in latex_commands) {
		var value = latex_commands[i]
		var start = Math.max(0, pos-value.length)
		var partial_line = line.slice(start)
		var index = partial_line.indexOf(value)
		if(index > -1 && index < value.length) {
			// We have found a match
			var end = start+index+value.length
			var next_char = line[end]
			// These characters would signify the end of a LaTeX command
			if('_^\n\\ \t()[]}'.indexOf(next_char) > -1) {
				return line.slice(0, start+index) + '\\color{red}{' + value + '}' + line.slice(end)
			}
		}
	}
	var indx = pos
	while(indx) {
		indx--
		if(line[indx] == '\\') {
			// This would mean that we have either found an illegal 
			// LaTeX command, something like '\alp', or one that 
			// we don't want to handle (not in the list above), like \frac{}{}
			return null
		}
		if('{}()[]_^ \t'.indexOf(line[indx]) > -1) {
			// We have a completely innocent character here, so we colour it
			return line.slice(0, pos) + '\\color{red}{' + line[pos] + '}' + line.slice(pos+1)
		}
	}
}
