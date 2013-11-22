def safe_content(dictionary, key):
	if not dictionary or key not in dictionary:
		return ""
	else:
		return dictionary[key]['content']

def safe_props(dictionary, key, *props):
	if not dictionary or key not in dictionary:
		return ';'.join(props)
	elif 'props' in dictionary[key]:
		return ';'.join(set(dictionary[key]['props'].split(';') + list(props)))
	else:
		return ';'.join(props)	
