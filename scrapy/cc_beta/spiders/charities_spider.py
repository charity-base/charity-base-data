import scrapy
from cc_beta.items import CharityItem

def format_text(x):
    if not x:
        return None
    stripped = x.strip()
    if not stripped or stripped == 'None':
        return None
    if stripped == str.upper(stripped):
        return str.title(stripped)
    return stripped

def format_integer(number_string):
    try:
        return int(number_string.strip().replace(',', ''))
    except:
        return None

class CharitiesSpider(scrapy.Spider):
    name = "charities"

    start_urls = [
        'http://beta.charitycommission.gov.uk/charity-search?p=1',
    ]

    def parse(self, response):

        # follow links to charity pages
        for href in response.css('a.charity-link::attr(href)'):
            yield response.follow(href, self.parse_charity)

        # follow pagination link
        for a in response.css('li.next a'):
            yield response.follow(a, callback=self.parse)

    def parse_charity(self, response):

        name = response.css('#ContentPlaceHolderDefault_cp_content_ctl00_CharityDetails_4_plHeading h1::text').extract_first()
        activities = response.css('#ContentPlaceHolderDefault_cp_content_ctl00_CharityDetails_4_TabContainer1_tpOverview_plActivities div::text').extract()[1]
        people = response.css('#plPeople span.small-header::text').extract()
        people_numbers = response.css('#plPeople span.mid-money::text').extract()
        people_dict = {}
        for x, n in zip(people, people_numbers):
            people_dict[str.lower(x)] = format_integer(n)

        url = response.url
        charity_number = format_integer(url.split('?regid=')[1].split('&')[0])

        charity = CharityItem(
            url=url,
            charity_number=charity_number,
            name=name,
            activities=format_text(activities),
            people=people_dict,
        )

        yield charity
