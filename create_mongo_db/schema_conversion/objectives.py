import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractObjects


def update_objectives(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating objectives.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractObjects)\
        .join(ExtractObjects, ExtractObjects.regno==ExtractMainCharity.regno, isouter=True)\
        .filter(ExtractObjects.subno == 0)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)\
        .order_by(ExtractObjects.regno, ExtractObjects.seqno)

        objectives = {}
        for i, x in enumerate(q):
            regno = x.ExtractObjects.regno
            
            objectives_part = stripped_or_none(x.ExtractObjects.objective)
            if not objectives_part:
                continue

            if regno not in objectives:
                objectives[regno] = ''

            objectives[regno] += objectives_part.replace('0001', '')
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'objectives': objectives[i]}}
        ) for i in objectives.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
