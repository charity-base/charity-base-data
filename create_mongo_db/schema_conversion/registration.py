import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractRegistration, ExtractRemoveRef


def update_registration(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating registration.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractRegistration, ExtractRemoveRef)\
        .join(ExtractRegistration, ExtractRegistration.regno==ExtractMainCharity.regno, isouter=True)\
        .join(ExtractRemoveRef, ExtractRemoveRef.code==ExtractRegistration.remcode, isouter=True)\
        .filter(ExtractRegistration.subno == 0)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        registration = {}
        for i, x in enumerate(q):
            regno = x.ExtractRegistration.regno
            
            if regno not in registration:
                registration[regno] = []

            registration[regno].append({
                'registered': x.ExtractRegistration.regdate,
                'removed': x.ExtractRegistration.remdate,
                'removedCode': stripped_or_none(x.ExtractRemoveRef.code) if x.ExtractRemoveRef else None,
                'removedReason': stripped_or_none(x.ExtractRemoveRef.text) if x.ExtractRemoveRef else None,
            })
            
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'registration': registration[i]}}
        ) for i in registration.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
