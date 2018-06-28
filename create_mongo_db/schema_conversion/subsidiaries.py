import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractCharity


def create_subsidiary(charity):
    c = {}
    c['id'] = charity.subno
    c['name'] = stripped_or_none(charity.name, 'title')
    c['isRegistered'] = charity.orgtype and charity.orgtype.strip() == 'R' 
    c['governingDoc'] = stripped_or_none(charity.gd)
    c['areaOfBenefit'] = stripped_or_none(charity.aob)
    c['contact'] = {
        'email': None,
        'person': stripped_or_none(charity.corr, 'title'),
        'phone': stripped_or_none(charity.phone),
        'postcode': stripped_or_none(charity.postcode),
        'address': [stripped_or_none(getattr(charity, add), 'title') for add in ['add1', 'add2', 'add3', 'add4', 'add5'] if getattr(charity, add) != None],
    }
    
    return c


def update_subsidiaries(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating subsidiaries.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractCharity)\
        .filter(ExtractCharity.orgtype == 'R')\
        .filter(ExtractCharity.subno > 0)\
        .filter(ExtractCharity.regno >= lower_limit)\
        .filter(ExtractCharity.regno < lower_limit + batch_size)

        subsidiaries = {}
        for i, x in enumerate(q):
            regno = x.regno
            
            if regno not in subsidiaries:
                subsidiaries[regno] = []

            subsidiaries[regno].append(create_subsidiary(x))
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'subsidiaries': subsidiaries[i]}}
        ) for i in subsidiaries.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
