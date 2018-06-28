import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractFinancial


def update_financial(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating finances.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractFinancial)\
        .join(ExtractFinancial, ExtractFinancial.regno==ExtractMainCharity.regno)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        financial = {}
        for i, x in enumerate(q):
            regno = x.ExtractFinancial.regno
            
            if regno not in financial:
                financial[regno] = []
            
            if x.ExtractFinancial.income is None and x.ExtractFinancial.expend is None:
                continue

            financial[regno].append({
                'financialYear': {
                    'begin': x.ExtractFinancial.fystart,
                    'end': x.ExtractFinancial.fyend,
                },
                'income': int(x.ExtractFinancial.income) if x.ExtractFinancial.income else None,
                'expend': int(x.ExtractFinancial.expend) if x.ExtractFinancial.expend else None,
            })
            
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'income.annual': financial[i]}}
        ) for i in financial.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
