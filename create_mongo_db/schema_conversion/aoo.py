import logging
from sqlalchemy import and_, func, ARRAY
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none, boolean_on_value
from schema.models import ExtractMainCharity, ExtractCharityAoo, ExtractAooRef

def update_aoo(session, charity_collection, lower_limit, upper_limit, batch_size=10000):

    logging.info("Updating areas of operation.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractCharityAoo.id, ExtractAooRef)\
        .join(ExtractCharityAoo, ExtractCharityAoo.regno==ExtractMainCharity.regno)\
        .join(ExtractAooRef, and_(ExtractAooRef.aootype==ExtractCharityAoo.aootype, ExtractAooRef.aookey==ExtractCharityAoo.aookey))\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        aoo = {}
        for i, x in enumerate(q):
            regno = x.regno
            
            if regno not in aoo:
                aoo[regno] = []
            

            aootype = stripped_or_none(x.ExtractAooRef.aootype)

            scale = {
                'A': 'UK Division',
                'B': 'Local Authority',
                'C': 'Metropolitan County',
                'D': 'Country',
                'E': 'Continent',
            }

            parent_aoo_id = None
            if aootype in ['B', 'D'] and x.ExtractAooRef.master and x.ExtractAooRef.master > 0:
                parent_aoo_id = '%s-%d' % (chr(ord(aootype)+1), x.ExtractAooRef.master)


            aoo[regno].append({
                'id': '%s-%d' % (x.ExtractAooRef.aootype, x.ExtractAooRef.aookey),
                'parentId': parent_aoo_id,
                'name': stripped_or_none(x.ExtractAooRef.aooname, 'title'),
                'alternativeName': stripped_or_none(x.ExtractAooRef.aoosort, 'title'),
                'locationType': scale[aootype],
                'isWelsh': boolean_on_value(x.ExtractAooRef.welsh, 'Y'),
            })
            
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'areasOfOperation': aoo[i]}}
        ) for i in aoo.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
