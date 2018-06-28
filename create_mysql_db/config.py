DB_HOST = "root@localhost"

DB_NAME = "RegPlusExtract_June_2018"

DATA_DIR = "/path/to/cc-data/2018-06/RegPlusExtract_June_2018"

FILE_DESCRIPTORS = [
    {
        'table_name' : 'extract_acct_submit',
        'file_name' : 'extract_acct_submit.bcp',
        'file_header' : [
            'regno',
            'submit_date',
            'arno',
            'fyend'
        ]
    },
    {
        'table_name' : 'extract_aoo_ref',
        'file_name' : 'extract_aoo_ref.bcp',
        'file_header' : [
            'aootype',
            'aookey',
            'aooname',
            'aoosort',
            'welsh',
            'master'
        ]
    },
    {
        'table_name' : 'extract_ar_submit',
        'file_name' : 'extract_ar_submit.bcp',
        'file_header' : [
            'regno',
            'arno',
            'submit_date'
        ]
    },
    {
        'table_name' : 'extract_charity',
        'file_name' : 'extract_charity.bcp',
        'file_header' : [
            'regno',
            'subno',
            'name',
            'orgtype',
            'gd',
            'aob',
            'aob_defined',
            'nhs',
            'ha_no',
            'corr',
            'add1',
            'add2',
            'add3',
            'add4',
            'add5',
            'postcode',
            'phone',
            'fax'
        ]
    },
    {
        'table_name' : 'extract_main_charity',
        'file_name' : 'extract_main_charity.bcp',
        'file_header' : [
            'regno',
            'coyno',
            'trustees',
            'fyend',
            'welsh',
            'incomedate',
            'income',
            'grouptype',
            'email',
            'web'
        ]
    },
    {
        'table_name' : 'extract_charity_aoo',
        'file_name' : 'extract_charity_aoo.bcp',
        'file_header' : [
            'regno',
            'aootype',
            'aookey',
            'welsh',
            'master'
        ]
    },
    {
        'table_name' : 'extract_class',
        'file_name' : 'extract_class.bcp',
        'file_header' : [
            'regno',
            'classno'
        ]
    },
    {
        'table_name' : 'extract_class_ref',
        'file_name' : 'extract_class_ref.bcp',
        'file_header' : [
            'classno',
            'classtext'
        ]
    },
    {
        'table_name' : 'extract_financial',
        'file_name' : 'extract_financial.bcp',
        'file_header' : [
            'regno',
            'fystart',
            'fyend',
            'income',
            'expend'
        ]
    },
    {
        'table_name' : 'extract_name',
        'file_name' : 'extract_name.bcp',
        'file_header' : [
            'regno',
            'subno',
            'nameno',
            'name'
        ]
    },
    {
        'table_name' : 'extract_objects',
        'file_name' : 'extract_objects.bcp',
        'file_header' : [
            'regno',
            'subno',
            'seqno',
            'objective'
        ]
    },
    {
        'table_name' : 'extract_partb',
        'file_name' : 'extract_partb.bcp',
        'file_header' : [
            'regno',
            'artype',
            'fystart',
            'fyend',
            'inc_leg',
            'inc_end',
            'inc_vol',
            'inc_fr',
            'inc_char',
            'inc_invest',
            'inc_other',
            'inc_total',
            'invest_gain',
            'asset_gain',
            'pension_gain',
            'exp_vol',
            'exp_trade',
            'exp_invest',
            'exp_grant',
            'exp_charble',
            'exp_gov',
            'exp_other',
            'exp_total',
            'exp_support',
            'exp_dep',
            'reserves',
            'asset_open',
            'asset_close',
            'fixed_assets',
            'open_assets',
            'invest_assets',
            'cash_assets',
            'current_assets',
            'credit_1',
            'credit_long',
            'pension_assets',
            'total_assets',
            'funds_end',
            'funds_restrict',
            'funds_unrestrict',
            'funds_total',
            'employees',
            'volunteers',
            'cons_acc',
            'charity_acc'
        
        ]
    },
    {
        'table_name' : 'extract_registration',
        'file_name' : 'extract_registration.bcp',
        'file_header' : [
            'regno',
            'subno',
            'regdate',
            'remdate',
            'remcode'
        ]
    },
    {
        'table_name' : 'extract_remove_ref',
        'file_name' : 'extract_remove_ref.bcp',
        'file_header' : [
            'code',
            'text'
        ]
    },
    {
        'table_name' : 'extract_trustee',
        'file_name' : 'extract_trustee.bcp',
        'file_header' : [
            'regno',
            'trustee'
        ]
    }
]
