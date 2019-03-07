def stripped_or_none(v, case=None):
    if not isinstance(v, str):
        return None

    # if v == '\u0000':
    #     return None

    if case == 'sentence':
        return v.strip().capitalize()

    if case == 'title':
        return v.strip().title()

    if case == 'lower':
        return v.strip().lower()

    return v.strip()

def boolean_on_value(v, true_value):
    return True if stripped_or_none(v) == true_value else False

def boolean_on_values(v, true_values):
    return True if stripped_or_none(v) in true_values else False

def int_or_none(integer_string):
    try:
        return int(integer_string.strip().replace(',', ''))
    except:
        return None

def validate_coh_id(coh_id):
    if not coh_id:
        return None
    length = len(coh_id)
    if length == 0:
        return None
    if length >= 8:
        return coh_id
    return '0'*(8-length) + coh_id
