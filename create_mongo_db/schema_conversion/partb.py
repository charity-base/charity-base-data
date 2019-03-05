import logging
from pymongo import UpdateOne
from pymongo.errors import BulkWriteError
from helpers.format import stripped_or_none, int_or_none, boolean_on_values
from schema.models import ExtractMainCharity, ExtractPartB


def update_partb(session, charity_collection, lower_limit, upper_limit, batch_size=1000):

    logging.info("Updating partb.")
    while lower_limit <= upper_limit:
        q = session\
        .query(ExtractMainCharity.regno, ExtractPartB)\
        .join(ExtractPartB, ExtractPartB.regno==ExtractMainCharity.regno)\
        .filter(ExtractMainCharity.regno >= lower_limit)\
        .filter(ExtractMainCharity.regno < lower_limit + batch_size)

        partb = {}
        for i, x in enumerate(q):
            regno = x.ExtractPartB.regno
            
            if regno not in partb:
                partb[regno] = []

            partb[regno].append({
                'financialYear': {
                    'begin': x.ExtractPartB.fystart,
                    'end': x.ExtractPartB.fyend,
                },
                'artype': stripped_or_none(x.ExtractPartB.artype),
                'inc_leg': int_or_none(x.ExtractPartB.inc_leg),
                'inc_end': int_or_none(x.ExtractPartB.inc_end),
                'inc_vol': int_or_none(x.ExtractPartB.inc_vol),
                'inc_fr': int_or_none(x.ExtractPartB.inc_fr),
                'inc_char': int_or_none(x.ExtractPartB.inc_char),
                'inc_invest': int_or_none(x.ExtractPartB.inc_invest),
                'inc_other': int_or_none(x.ExtractPartB.inc_other),
                'inc_total': int_or_none(x.ExtractPartB.inc_total),
                'invest_gain': int_or_none(x.ExtractPartB.invest_gain),
                'asset_gain': int_or_none(x.ExtractPartB.asset_gain),
                'pension_gain': int_or_none(x.ExtractPartB.pension_gain),
                'exp_vol': int_or_none(x.ExtractPartB.exp_vol),
                'exp_trade': int_or_none(x.ExtractPartB.exp_trade),
                'exp_invest': int_or_none(x.ExtractPartB.exp_invest),
                'exp_grant': int_or_none(x.ExtractPartB.exp_grant),
                'exp_charble': int_or_none(x.ExtractPartB.exp_charble),
                'exp_gov': int_or_none(x.ExtractPartB.exp_gov),
                'exp_other': int_or_none(x.ExtractPartB.exp_other),
                'exp_total': int_or_none(x.ExtractPartB.exp_total),
                'exp_support': int_or_none(x.ExtractPartB.exp_support),
                'exp_dep': int_or_none(x.ExtractPartB.exp_dep),
                'reserves': int_or_none(x.ExtractPartB.reserves),
                'asset_open': int_or_none(x.ExtractPartB.asset_open),
                'asset_close': int_or_none(x.ExtractPartB.asset_close),
                'fixed_assets': int_or_none(x.ExtractPartB.fixed_assets),
                'open_assets': int_or_none(x.ExtractPartB.open_assets),
                'invest_assets': int_or_none(x.ExtractPartB.invest_assets),
                'cash_assets': int_or_none(x.ExtractPartB.cash_assets),
                'current_assets': int_or_none(x.ExtractPartB.current_assets),
                'credit_1': int_or_none(x.ExtractPartB.credit_1),
                'credit_long': int_or_none(x.ExtractPartB.credit_long),
                'pension_assets': int_or_none(x.ExtractPartB.pension_assets),
                'total_assets': int_or_none(x.ExtractPartB.total_assets),
                'funds_end': int_or_none(x.ExtractPartB.funds_end),
                'funds_restrict': int_or_none(x.ExtractPartB.funds_restrict),
                'funds_unrestrict': int_or_none(x.ExtractPartB.funds_unrestrict),
                'funds_total': int_or_none(x.ExtractPartB.funds_total),
                'employees': int_or_none(x.ExtractPartB.employees),
                'volunteers': int_or_none(x.ExtractPartB.volunteers),
                'cons_acc': boolean_on_values(x.ExtractPartB.cons_acc, ['ConsolidatedAccounts', 'T', 'TRUE', 'YES']),
                'charity_acc': boolean_on_values(x.ExtractPartB.charity_acc, ['CharityOnlyAccounts', 'T', 'TRUE', 'YES']),
            })
            
        requests = [UpdateOne(
            {'ids.GB-CHC': i},
            {'$set': {'income.breakdown': partb[i]}}
        ) for i in partb.keys()]
        
        logging.info(lower_limit)
        
        lower_limit += batch_size
        
        if len(requests) == 0:
            continue
            
        try:
            result = charity_collection.bulk_write(requests)
    #         print(lower_limit, lower_limit + batch_size, result.matched_count)
        except BulkWriteError as bwe:
            logging.error(bwe.details)
