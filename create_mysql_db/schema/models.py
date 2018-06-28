from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Unicode, ForeignKey

Base = declarative_base()


class ExtractAcctSubmit(Base):
    __tablename__ = 'extract_acct_submit'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    submit_date = Column(DateTime, nullable=True)
    arno = Column(String(4), nullable=False)
    fyend = Column(String(4), nullable=True)

    def __repr__(self):
      return "<ExtractAcctSubmit(regno='%d')>" % (self.regno)


class ExtractAooRef(Base):
    __tablename__ = 'extract_aoo_ref'
    
    id = Column(Integer, primary_key=True)
    
    aooname = Column(String(255), nullable=False)
    aoosort = Column(String(100), nullable=False)
    aootype = Column(String(10), nullable=False)
    aookey = Column(Integer, nullable=True)
    welsh = Column(String(1), nullable=False)
    master = Column(Integer, nullable=True)
    
    def __repr__(self):
      return "<ExtractAooRef(aooname='%s')>" % (self.aooname)

class ExtractArSubmit(Base):
    __tablename__ = 'extract_ar_submit'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    arno = Column(String(4), nullable=False)
    submit_date = Column(DateTime, nullable=True)

    def __repr__(self):
      return "<ExtractArSubmit(regno='%d')>" % (self.regno)


class ExtractMainCharity(Base):
    __tablename__ = 'extract_main_charity'
    
    # id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, ForeignKey('extract_charity.regno'), nullable=False, primary_key=True)
    # regno = Column(Integer, nullable=False, primary_key=True)
    coyno = Column(String(50), nullable=True)
    trustees = Column(String(1), nullable=False)
    fyend = Column(String(4), nullable=True)
    welsh = Column(String(1), nullable=False)
    incomedate = Column(DateTime, nullable=True)
    income = Column(Numeric(12, 0), nullable=True)
    grouptype = Column(String(3), nullable=True)
    email = Column(String(400), nullable=True)
    web = Column(String(400), nullable=True)

    subs = relationship("ExtractCharity")

    def __repr__(self):
      return "<ExtractMainCharity(regno='%d')>" % (self.regno)


class ExtractCharity(Base):
    __tablename__ = 'extract_charity'
    
    # id = Column(Integer, primary_key=True)
    
    # regno = Column(Integer, ForeignKey('extract_main_charity.regno'), nullable=False)

    regno = Column(Integer, nullable=True, primary_key=True)
    subno = Column(Integer, nullable=True, primary_key=True)
    name = Column(String(150), nullable=True)
    orgtype = Column(String(10), nullable=True)
    gd = Column(Unicode(10000), nullable=True)
    aob = Column(String(255), nullable=True)
    aob_defined = Column(Integer, nullable=True)
    nhs = Column(String(1), nullable=False)
    ha_no = Column(Integer, nullable=True)
    corr = Column(String(255), nullable=True)
    add1 = Column(String(35), nullable=True)
    add2 = Column(String(35), nullable=True)
    add3 = Column(String(35), nullable=True)
    add4 = Column(String(35), nullable=True)
    add5 = Column(String(35), nullable=True)
    postcode = Column(String(8), nullable=True)
    phone = Column(String(400), nullable=True)
    fax = Column(Integer, nullable=True)
    
    def __repr__(self):
      return "<ExtractCharity(regno='%d', subno='%d')>" % (self.regno, self.subno)




class ExtractCharityAoo(Base):
    __tablename__ = 'extract_charity_aoo'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    aootype = Column(String(10), nullable=False)
    aookey = Column(Integer, nullable=False)
    welsh = Column(String(1), nullable=False)
    master = Column(Integer, nullable=True)

    def __repr__(self):
      return "<ExtractCharityAoo(regno='%d')>" % (self.regno)


class ExtractClass(Base):
    __tablename__ = 'extract_class'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    # Naming the field 'classno' instead of 'class'
    classno = Column(String(10), nullable=False)

    def __repr__(self):
      return "<ExtractClass(regno='%d')>" % (self.regno)


class ExtractClassRef(Base):
    __tablename__ = 'extract_class_ref'
    
    id = Column(Integer, primary_key=True)
    
    classno = Column(String(10), nullable=False)
    classtext = Column(String(65), nullable=True)

    def __repr__(self):
      return "<ExtractClassRef(classno='%s')>" % (self.classno)


class ExtractFinancial(Base):
    __tablename__ = 'extract_financial'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    fystart = Column(DateTime, nullable=True)
    fyend = Column(DateTime, nullable=True)
    income = Column(Numeric(12, 0), nullable=True)
    expend = Column(Numeric(12, 0), nullable=True)

    def __repr__(self):
      return "<ExtractFinancial(regno='%d', fyend='%s')>" % (self.regno, self.fyend)


class ExtractName(Base):
    __tablename__ = 'extract_name'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    subno = Column(Integer, nullable=True)
    nameno = Column(Integer, nullable=False)
    name = Column(String(255), nullable=True)

    def __repr__(self):
      return "<ExtractName(regno='%d', subno='%d', nameno='%d')>" % (self.regno, self.subno, self.nameno)


class ExtractObjects(Base):
    __tablename__ = 'extract_objects'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    subno = Column(Integer, nullable=True)
    seqno = Column(String(4), nullable=True)
    # Naming the field 'objective' instead of 'object'
    objective = Column(String(10000), nullable=True)

    def __repr__(self):
      return "<ExtractObjects(regno='%d', subno='%d', seqno='%s')>" % (self.regno, self.subno, self.seqno)


class ExtractPartB(Base):
    __tablename__ = 'extract_partb'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    artype = Column(String(4), nullable=False)
    fystart = Column(DateTime, nullable=False)
    fyend = Column(DateTime, nullable=False)
    inc_leg = Column(String(255), nullable=True)
    inc_end = Column(String(255), nullable=True)
    inc_vol = Column(String(255), nullable=True)
    inc_fr = Column(String(255), nullable=True)
    inc_char = Column(String(255), nullable=True)
    inc_invest = Column(String(255), nullable=True)
    inc_other = Column(String(255), nullable=True)
    inc_total = Column(String(255), nullable=True)
    invest_gain = Column(String(255), nullable=True)
    asset_gain = Column(String(255), nullable=True)
    pension_gain = Column(String(255), nullable=True)
    exp_vol = Column(String(255), nullable=True)
    exp_trade = Column(String(255), nullable=True)
    exp_invest = Column(String(255), nullable=True)
    exp_grant = Column(String(255), nullable=True)
    exp_charble = Column(String(255), nullable=True)
    exp_gov = Column(String(255), nullable=True)
    exp_other = Column(String(255), nullable=True)
    exp_total = Column(String(255), nullable=True)
    exp_support = Column(String(255), nullable=True)
    exp_dep = Column(String(255), nullable=True)
    reserves = Column(String(255), nullable=True)
    asset_open = Column(String(255), nullable=True)
    asset_close = Column(String(255), nullable=True)
    fixed_assets = Column(String(255), nullable=True)
    open_assets = Column(String(255), nullable=True)
    invest_assets = Column(String(255), nullable=True)
    cash_assets = Column(String(255), nullable=True)
    current_assets = Column(String(255), nullable=True)
    credit_1 = Column(String(255), nullable=True)
    credit_long = Column(String(255), nullable=True)
    pension_assets = Column(String(255), nullable=True)
    total_assets = Column(String(255), nullable=True)
    funds_end = Column(String(255), nullable=True)
    funds_restrict = Column(String(255), nullable=True)
    funds_unrestrict = Column(String(255), nullable=True)
    funds_total = Column(String(255), nullable=True)
    employees = Column(String(255), nullable=True)
    volunteers = Column(String(255), nullable=True)
    cons_acc = Column(String(255), nullable=True)
    charity_acc = Column(String(255), nullable=True)

    def __repr__(self):
      return "<ExtractPartB(regno='%d', fyend='%s')>" % (self.regno, self.fyend)


class ExtractRegistration(Base):
    __tablename__ = 'extract_registration'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    subno = Column(Integer, nullable=True)
    regdate = Column(DateTime, nullable=True)
    remdate = Column(DateTime, nullable=True)
    remcode = Column(String(3), nullable=True)

    def __repr__(self):
      return "<ExtractRegistration(regno='%d', subno='%d', regdate='%s')>" % (self.regno, self.subno, self.regdate)


class ExtractRemoveRef(Base):
    __tablename__ = 'extract_remove_ref'
    
    id = Column(Integer, primary_key=True)
    
    code = Column(String(3), nullable=True)
    text = Column(String(25), nullable=True)

    def __repr__(self):
      return "<ExtractRemoveRef(code='%s')>" % (self.code)


class ExtractTrustee(Base):
    __tablename__ = 'extract_trustee'
    
    id = Column(Integer, primary_key=True)
    
    regno = Column(Integer, nullable=True)
    trustee = Column(String(255), nullable=True)

    def __repr__(self):
      return "<ExtractTrustee(regno='%d', trustee='%s')>" % (self.regno, self.trustee)


models = [
  ExtractAcctSubmit,
  ExtractAooRef,
  ExtractArSubmit,
  ExtractMainCharity,
  ExtractCharity,
  ExtractCharityAoo,
  ExtractClass,
  ExtractClassRef,
  ExtractFinancial,
  ExtractName,
  ExtractObjects,
  ExtractPartB,
  ExtractRegistration,
  ExtractRemoveRef,
  ExtractTrustee,
]
