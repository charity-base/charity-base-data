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
