import logging
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none, boolean_on_value
from schema.models import ExtractCharity, ExtractMainCharity

def create_charity(charity, main_charity):
    c = {}
    c['regulator'] = 'GB-CHC'
    c['ids'] = {
        'charityId': 'GB-CHC-%d' % charity.regno,
        'GB-CHC': charity.regno,
    }
    c['name'] = stripped_or_none(charity.name, 'title')
    c['isRegistered'] = charity.orgtype and charity.orgtype.strip() == 'R' 
    c['governingDoc'] = stripped_or_none(charity.gd)
    c['areaOfBenefit'] = stripped_or_none(charity.aob, 'title')
    c['contact'] = {
        'email': stripped_or_none(main_charity.email, 'lower'),
        'person': stripped_or_none(charity.corr, 'title'),
        'phone': stripped_or_none(charity.phone),
        'postcode': stripped_or_none(charity.postcode),
        'address': [stripped_or_none(getattr(charity, add), 'title') for add in ['add1', 'add2', 'add3', 'add4', 'add5'] if getattr(charity, add) != None]
    }
    c['isWelsh'] = boolean_on_value(main_charity.welsh, 'T')

    c['trustees'] = {
        'incorporated': boolean_on_value(main_charity.trustees, 'T'),
        'names': []
    }
    c['website'] = stripped_or_none(main_charity.web, 'lower')
    c['isSchool'] = boolean_on_value(main_charity.grouptype, 'SCH')
    c['income'] = {
        'latest': {
            'date': main_charity.incomedate,
            'total': int(main_charity.income) if main_charity.income != None else None,
        },
        'annual': []
    }
    c['fyend'] = stripped_or_none(main_charity.fyend)
    c['companiesHouseNumber'] = stripped_or_none(main_charity.coyno)

    c['areasOfOperation'] = []
    c['causes'] = []
    c['beneficiaries'] = []
    c['operations'] = []
    c['subsidiaries'] = []
    c['alternativeNames'] = []

    c['activities'] = None
    
    return c



def insert_charities(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Inserting charities")
    while lower_limit <= upper_limit:
        
        q = session\
        .query(ExtractCharity, ExtractMainCharity)\
        .join(ExtractMainCharity, ExtractMainCharity.regno==ExtractCharity.regno)\
        .filter(ExtractCharity.orgtype == 'R')\
        .filter(ExtractCharity.subno == 0)\
        .filter(ExtractCharity.regno >= lower_limit)\
        .filter(ExtractCharity.regno < lower_limit + batch_size)

        charities = []
        for i, x in enumerate(q):

            c = create_charity(x.ExtractCharity, x.ExtractMainCharity)
            charities.append(c)
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(charities) == 0:
            continue
            
        try:
            result = charity_collection.insert_many(charities)
    #         print(result.inserted_ids)
        except BulkWriteError as bwe:
            logging.error(bwe.details)

