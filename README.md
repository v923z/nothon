A few comments on use
======

After starting nothon.py, the notebook can be accessed at address 

http://127.0.0.1:8080/static/test.html

A new div can be added by clicking on the appropriate type at the top of the HTML file. 
An active div can be removed by clicking on remove.

Mathematical formulae can be inserted in a text box by enclosing a LaTeX expression between 
$$...$$ (display style), or between \\(...\\) (inline style). 

Units can be "executed" by pressing `Cntr+Enter`. This will collect the head/tail of files, 
render mathematical formulae and so on. 

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
