import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractName


def update_names(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating names.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractName)\
        .join(ExtractName, ExtractName.regno==ExtractMainCharity.regno)\
        .filter(ExtractName.subno == 0)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        names = {}
        for i, x in enumerate(q):
            regno = x.ExtractName.regno
            
            if regno not in names:
                names[regno] = []
            
            names[regno].append(stripped_or_none(x.ExtractName.name, 'title'))
            
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'alternativeNames': names[i]}}
        ) for i in names.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
