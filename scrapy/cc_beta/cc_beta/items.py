# -*- coding: utf-8 -*-
import scrapy

class CharityItem(scrapy.Item):
    charity_number = scrapy.Field()
    url = scrapy.Field()
    name = scrapy.Field()
    activities = scrapy.Field()
    people = scrapy.Field()
