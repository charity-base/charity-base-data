import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none
from schema.models import ExtractMainCharity, ExtractRegistration, ExtractRemoveRef

def get_latest_registration(registrations):
    if not registrations or len(registrations) == 0:
      return None
    active_registration_dates = [x['registrationDate'] for x in registrations if not x['removalDate']]
    if len(active_registration_dates) == 0:
      return None
    return sorted(active_registration_dates, reverse=True)[0]

def update_registration(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating registrations.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractRegistration, ExtractRemoveRef)\
        .join(ExtractRegistration, ExtractRegistration.regno==ExtractMainCharity.regno, isouter=True)\
        .join(ExtractRemoveRef, ExtractRemoveRef.code==ExtractRegistration.remcode, isouter=True)\
        .filter(ExtractRegistration.subno == 0)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        registrations = {}
        for i, x in enumerate(q):
            regno = x.ExtractRegistration.regno
            
            if regno not in registrations:
                registrations[regno] = []

            registrations[regno].append({
                'registrationDate': x.ExtractRegistration.regdate,
                'removalDate': x.ExtractRegistration.remdate,
                'removalCode': stripped_or_none(x.ExtractRemoveRef.code) if x.ExtractRemoveRef else None,
                'removalReason': stripped_or_none(x.ExtractRemoveRef.text) if x.ExtractRemoveRef else None,
            })
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {
                '$set': {
                    'registrations': sorted(registrations[i], key=lambda x: x['registrationDate'], reverse=True),
                    'lastRegistrationDate': get_latest_registration(registrations[i])
                }
            }
        ) for i in registrations.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
