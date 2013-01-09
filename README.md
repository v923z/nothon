A few comments on use
======

After starting nothon.py, the notebook can be accessed at address 

http://127.0.0.1:8080/static/test.html

A new div can be added by clicking on the appropriate under the + sign on the right hand side. 
The active div can be removed by clicking on remove. This operation moves the divide to the trash, 
which is part of the document, but is a hidden divide. By clicking on recover, the last block in the 
trash is restored to the visible part of the document, and is inserted as the last divide. Blocks of 
the document can be moved up or down by clicking on the up or down arrow on the right hand side. 

Mathematical formulae can be inserted in a text box by enclosing a LaTeX expression between 
$$...$$ (display style), or between \\(...\\) (inline style). 

Headers are evaluated by pressing `Enter`. This will move the cursor to the body of a text header, 
or send a request to the server for a code or head header. 

Units can be "executed" by pressing `Cntr+Enter`. This will collect render mathematical formulae, 
or execute a plot. 

The body of a unit (text, plot, etc) can be made hidden by clicking on the gray outline 
on the right hand side. The body will re-appear, if one clicks on the gray area once more.

Plots can be created by simply calling 

	plot(sin(x))

This will automatically create an array by calling x = linspace(-10, 10, 100). If this range 
(or frequency) is not appropriate for a particular plot, the user can override it by specifically 
sending 

	x = linspace(0, 2, 1000)
	plot(sin(x))

to the server. Note that no error checking is done at the moment, so if the syntax is wrong, nothing 
will happen. This will be fixed in a future version. 

By pressing "save", the stripped content of the notebook will be written to nothon.note. 
