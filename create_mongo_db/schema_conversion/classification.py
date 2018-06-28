import logging
from sqlalchemy import and_, func, ARRAY
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none, boolean_on_value
from schema.models import ExtractMainCharity, ExtractClass, ExtractClassRef

def update_causes(session, charity_collection, lower_limit, upper_limit, batch_size=10000):

    logging.info("Updating causes.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractClass.id, ExtractClassRef)\
        .join(ExtractClass, ExtractClass.regno==ExtractMainCharity.regno)\
        .join(ExtractClassRef, ExtractClassRef.classno==ExtractClass.classno)\
        .filter(ExtractClass.classno < 200)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        causes = {}
        for i, x in enumerate(q):
            regno = x.regno

            if regno not in causes:
                causes[regno] = []

            causes[regno].append({
                'id': int(x.ExtractClassRef.classno),
                'name': stripped_or_none(x.ExtractClassRef.classtext, 'sentence'),
            })
            
        
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'causes': causes[i]}}
        ) for i in causes.keys()] 
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)


def update_beneficiaries(session, charity_collection, lower_limit, upper_limit, batch_size=10000):

    logging.info("Updating beneficiaries.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractClass.id, ExtractClassRef)\
        .join(ExtractClass, ExtractClass.regno==ExtractMainCharity.regno)\
        .join(ExtractClassRef, ExtractClassRef.classno==ExtractClass.classno)\
        .filter(ExtractClass.classno >= 200)\
        .filter(ExtractClass.classno < 300)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        beneficiaries = {}
        for i, x in enumerate(q):
            regno = x.regno

            if regno not in beneficiaries:
                beneficiaries[regno] = []

            beneficiaries[regno].append({
                'id': int(x.ExtractClassRef.classno),
                'name': stripped_or_none(x.ExtractClassRef.classtext, 'sentence'),
            })
            
        
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'beneficiaries': beneficiaries[i]}}
        ) for i in beneficiaries.keys()] 
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)


def update_operations(session, charity_collection, lower_limit, upper_limit, batch_size=10000):

    logging.info("Updating operations.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractClass.id, ExtractClassRef)\
        .join(ExtractClass, ExtractClass.regno==ExtractMainCharity.regno)\
        .join(ExtractClassRef, ExtractClassRef.classno==ExtractClass.classno)\
        .filter(ExtractClass.classno >= 300)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        operations = {}
        for i, x in enumerate(q):
            regno = x.regno

            if regno not in operations:
                operations[regno] = []

            operations[regno].append({
                'id': int(x.ExtractClassRef.classno),
                'name': stripped_or_none(x.ExtractClassRef.classtext, 'sentence'),
            })
            
        
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'operations': operations[i]}}
        ) for i in operations.keys()] 
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
