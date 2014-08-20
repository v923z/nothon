import simplejson
import sys

def update_notebook12(target):
    nb = get_notebook(target)
    if nb['nothon version'] != 1.2:
        return False
    nb['nothon version'] = 1.3
    for cells in nb['notebook']:
        cells['count'] = cells['id']
        cells['id'] = 'div_' + cells['type'] + '_main_' + '%s'%cells['id']
      
    nb_str = '{\n"title" : "%s",\n'%nb['title'] + '"type": "notebook",\n' + '"directory" : "%s",\n'%nb['title']  
    nb_str += '"date" : "%s",\n'%nb['date'] + '"nothon version" : 1.3,\n'
    nb_str += '"notebook" : %s\n}'%(simplejson.dumps(nb['notebook'], sort_keys=True, indent=4))
    
    with open(fn, 'w') as fout:
        fout.write(nb_str)
            
def update_notebook13(fn):

    def get_notebook(fn):
        with open(fn, 'r') as fin:
            data = simplejson.load(fin)
        return data

    nb = get_notebook(fn)
    if nb['nothon version'] != 1.3:
        return False
    _metadata = {}
    _metadata['nothon version'] = 1.4
    _metadata['directory'] = nb.get('directory')
    _metadata['title'] = nb.get('title')
    _metadata['type'] = 'notebook'
    _metadata['date'] = nb.get('date')
    
    for cell in nb['notebook']:
        if cell['type'] in ('head'):
            cell['content']['head_header']['toc'] = 'true'
        if cell['type'] in ('paragraph'):
            cell['content']['paragraph_body']['searchable'] = 'true'
        if cell['type'] in ('text'):
            cell['content']['text_body']['searchable'] = 'true'
            cell['content']['text_header']['searchable'] = 'true'
            cell['content']['text_header']['toc'] = 'true'
        if cell['type'] in ('plot'):
            cell['content']['plot_caption']['searchable'] = 'true'
            cell['content']['plot_caption']['toc'] = 'true'
            cell['content']['plot_header']['searchable'] = 'true'  
        for cont in cell['content']:
            del cell['content'][cont]['props']
                
    new_nb = {'_metadata': _metadata, 'notebook': nb['notebook']}
    
    with open(fn, 'w') as fout:
        fout.write(simplejson.dumps(new_nb, sort_keys=True, indent=4))
        
if __name__ == '__main__':

    update_notebook13(sys.argv[1])
    