from zeep import Client

client = Client('https://sandbox.netchb.com/main/services/entry/EntryUploadService?wsdl')

xml = """
<entry xmlns="http://www.netchb.com/xml/entry"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.netchb.com/xml/entry
http://www.netchb.com/xml/entry/entry.xsd">
<entry-no>
<user-specified> <filer-code>ABC</filer-code> <entry-no>1234569</entry-no> </user-specified>
</entry-no>
<transmit-3461/>
<via-ace/>
<!-- this is the NetChb user that the entry should be assigned to -->
<assign-to>guylichtenstein-sbx</assign-to>
<header>
<!-- importer tax id is optional. In many cases the broker will choose to
be the IOR for type 86 -->
<importer-tax-id>98-12079110B</importer-tax-id>
<processing-port>8888</processing-port>
<entry-port>8888</entry-port>
<entry-date>2024-08-03</entry-date>
<entry-type>86</entry-type>
<mode-transportation>40</mode-transportation>
<unlading-port>8888</unlading-port>
<certify-cargo-release-via-ace/>
<carrier-code>AA</carrier-code>
<voyage-no>001</voyage-no>
<!-- location of goods is optional -->
<location-of-goods>U200</location-of-goods>
</header>
<manifest>
<bill-of-lading>
<master-bill>00100000011</master-bill>
<house-bill>123456</house-bill>
<quantity>1</quantity>
<unit>PKGS</unit>
</bill-of-lading>
</manifest>
<ace-cargo-release-parties>
<entity>
<entity-code>SE</entity-code>
<entity-name>SOME SELLER</entity-name>
<entity-information>
<entity-address>
<address-components>
<address-component>
<component-type>01</component-type>
<address-information>101</address-information>
</address-component>
<address-component>
<component-type>02</component-type>
<address-information>THE STREET NAME</address-information>
</address-component>
</address-components>
<city>THE CITY</city>
<postal-code>10101</postal-code>
<country>CN</country>
</entity-address>
</entity-information>
</entity>
<entity>
<entity-code>CN</entity-code>
<entity-name>THE CONSIGNEE</entity-name>
<entity-information>
<entity-address>
<address-components>
<address-component>
<component-type>01</component-type>
<address-information>222</address-information>
</address-component>
<address-component>
<component-type>02</component-type>
<address-information>THE DELIVERY STREET</address-information>
</address-component>
</address-components>
<city>NEW YORK</city>
<state-province-code>NY</state-province-code>
<postal-code>10011</postal-code>
<country>US</country>
</entity-address>
</entity-information>
</entity>
</ace-cargo-release-parties>
<invoices>
<invoice>
<!-- Use HAWB if none -->
<invoice-no>10101</invoice-no>
<line-items>
<line-item>
<country-origin>CN</country-origin>
<tariffs>
<tariff>
<tariff-no>1201001100</tariff-no>
<value>100</value>
</tariff>
</tariffs>
</line-item>
</line-items>
</invoice>
</invoices>
</entry>
"""
response = client.service.uploadEntry(
'guylichtenstein-sbx', 'Kn2Tech@Miami1!!', xml )
print(response)