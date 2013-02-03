A few comments on use
======

After starting nothon.py, the notebook can be accessed at address 

http://127.0.0.1:8080/

A new div can be added by clicking on the appropriate label under the + sign on the right hand side. 
The active div can be removed by clicking on remove. This operation moves the divide to the trash, 
which is part of the document, but is a hidden divide. (The trash can be made visible by clicking on 
the trashbin icon on the lower right corner.) By clicking on recover, either the active block of 
the trashbin, or if that does not exist, then the last block in the trash is restored to the visible 
part of the document, and is inserted as the last divide. Blocks of the document can be moved up or 
down by clicking on the up or down arrow on the right hand side. 

Mathematical formulae can be inserted in a text box by enclosing a LaTeX expression between 
$$...$$ (display style), or between \\(...\\) (inline style). The raw LaTeX code can be retrieved 
from the server by clicking on the gray shaded area next to the **body** of the text. Alternatively, 
`Cntr - M`, and `Cntr - Alt - M` inserts inline, and display style math, respectively. By clicking 
on the gray area at the level of the header of the text, the body will become hidden. (This will not work now!)

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

to the server. Note that in case of an error, the traceback is returned to the client, and is displayed 
instead of the (missing) plot. 

The text style in a text box can be changed by highlighting some elements, and then hitting `Cntr-B` **bold**, 
`Cntr-I` *italic*, or `Cntr-U` __underlined__.

By pressing "save", the stripped content of the notebook will be written to nothon.note. 

Using "html" produces the stand-alone html document nothon.html. 
