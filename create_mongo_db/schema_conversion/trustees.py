import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractTrustee

def update_trustees(session, charity_collection, lower_limit, upper_limit, batch_size=10000):

    logging.info("Updating trustees")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractTrustee)\
        .join(ExtractTrustee, ExtractTrustee.regno==ExtractMainCharity.regno)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        trustees = {}
        for i, x in enumerate(q):
            regno = x.ExtractTrustee.regno
            
            if regno not in trustees:
                trustees[regno] = []
            
            trustees[regno].append(stripped_or_none(x.ExtractTrustee.trustee, 'title'))
            
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'trustees.names': trustees[i]}}
        ) for i in trustees.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
