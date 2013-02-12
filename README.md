A few comments on use
======

After starting nothon.py, the notebook can be accessed at address 

http://127.0.0.1:8080/?name=somenotebook.note

If the notebook exists (this should be a JSON file), then its content will be rendered in the browser. 
If it doesn't exist, then a new notebook with that name will be created. When saving this notebook, its 
content will be written to disc under the name somenotebook.note. 

Once in the browser, a new div can be added by clicking on the appropriate label under the + sign on the 
right hand side. The active div's parent (always indicated by a thick right-hand-side border) can be 
removed by clicking on remove. This operation moves the divide to the trash, which is part of the document, 
but is hidden. (The trash can be made visible by clicking on the trashbin icon on the lower right corner.) 
By clicking on recover, either the active block of the trashbin, or if that does not exist, then the last 
block in the trash is restored to the visible part of the document, and is inserted as the last divide. 
Blocks of the document can be moved up or down by clicking on the up or down arrow on the right hand side. 

Mathematical formulae can be inserted in a text box by enclosing a LaTeX expression between 
\\[...\\] (display style), or between \\(...\\) (inline style). The raw LaTeX code can be retrieved 
by clicking on the gray shaded area next to the **body** of the text. Alternatively, 
`Cntr - M`, and `Cntr - Alt - M` inserts inline, and display style math, respectively. By clicking 
on the gray area at the level of the header of the text, the body will become hidden. The same thing 
happens in the case of code, and head blocks, while by doing the same on a plot block, the code that 
generates the plot becomes hidden. 

Headers in text, code, and head blocks are evaluated by pressing `Enter`. This moves the cursor to 
the body of a text header, or send a request to the server to execute and return the output of the 
corresponding handler function. 

Units can be "executed" by pressing `Cntr+Enter`. This will render mathematical formulae in a text block, 
or execute a plot. If `Shift+Enter` is pressed, a new block of the same type is also inserted into the 
notebook.

matplotlib plots can be created by simply calling 

	plot(sin(x))

This will automatically create an array by calling x = linspace(-10, 10, 100). If this range 
(or frequency) is not appropriate for a particular plot, the user can override it by specifically 
sending 

	x = linspace(0, 2, 1000)
	plot(sin(x))

to the server. Note that in case of an error, the traceback is returned to the client, and is displayed 
instead of the (missing) plot. Since the header of a plot block is executed on the server side by calling 
the python function `exec`, not only plot commands are supported, but arbitrary python code can be executed 
in this way. Therefore, 

	x = linspace(0, 2, 1000)
	y = x**2
	plot(y)

is also a valid piece of code. 

Note, however, that the default plotting backend can be overriden by adding an identifier to the first line of the 
code block. The following code will call gnuplot instead of matplotlib:

	# gnuplot
	plot sin(x)
	
write the corresponding file to disc, retrieve its content, and insert it in the notebook. When doing so, keep in 
mind that the whole code block will be passed to gnuplot, therefore, python codes will throw a gnuplot error. 

The text style in a text block can be changed by highlighting some elements, and then hitting `Cntr-B` **bold**, 
`Cntr-I` *italic*, or `Cntr-U` __underlined__.

By pressing "save", the stripped content of the notebook will be written to somenotebook.note. 

Using "html" produces the stand-alone html document somenotebook.html, i.e., all required style sheets, 
and images will be included. 

If maxima is installed, symbolic manipulations can be performed by inserting a piece of valid maxima code in a 
text box between a pair of `&&` delimiters. E.g., 

	&&solve(x+4=0, x);&&
	
will return, and format the results using Mathjax. The maxima code is executed when the fourth ampersand is 
pressed, no other action is required. At the moment, the maxima code is lost, once the evaluation is done. In 
a future version, the the user will be able to retrieve the code. If the code execution results in a failure, 
the code is not touched, so that it can still be edited. Instead, the user is presented with an alert. 

Developer notes
========

nothon can easily be extended without having to touch the core of either the server, or the client side's code. 
If the rules below are followed, then a new plugin is automatically inserted in the menu. 

First, one needs a template for a new plugin. This should include the html+python code that web.py can parse. 
(http://webpy.org/docs/0.3/tutorial#templating). The code should also indicate, which parts have to be saved. 
This can be done by adding the attribute `data-nothon="save;"` to any elements in the template. This template 
should take two arguments, a single number (this will be the identifier of its main div), and a dictionary 
containing the content. The dictionary can be simply `False`, in which case an empty javascript template will 
be created at startup. If the template in `templates/` is called new_plugin_html.html, the corresponding 
javascript function will be written to static/js/new_plugin.js. static/js/ should also contain a file 
_new_plugin.js, which contains at least the following five functions: 

	new_plugin_activate(id)
	
for determining which sub-element of new_plugin will become active, in case the main is activated, 

	new_plugin_onclick(event)
	
for determining what and how happens, if the user clicks on the element, 

	new_plugin_keypress(event)

if there are any sub-element for which a keypress event is meaningful, 

	new_plugin_data(div) 
	
for executing a server request, and finally, 

	new_plugin_sanitise(block)
	
This last function should strip the content of a new_plugin block before saving. For an example, see 
_plot.js, and the functions therein.

In addition, on the server side, one also needs a the following functions:

	new_plugin_handler(message)
	
that takes a JSON message from the client, and returns the resulting data to the client, and 

	new_plugin_update_dictionary(dictionary)
	
which takes the dictionary generated from "new_plugin" entry of a saved notebook, and turns it into 
a dictionary that can be passed to the template. This is required, because some block types do not 
store the content of a block on disc, only some associated data. One example would be the plot block, 
which does not store the actual plot, only the code, and a link to the file on the disc. Therefore, 
when rendering the notebook, the server has to locate the file on disc, and generate its base64 
representation. 

Future plans
=======

* Adding search functionality. This might mean that another tag, "searchable" will have to be added 
to the list in data-nothon. 

* Adding support for tables.

* Adding support for a simple canvas element.

* Adding the option for saving notebooks into PDF. This should be done through LaTeX, and templating. 

* Adding support for matlab plots. This should be trivial, and be done in the same way as we handle gnuplot. 
