<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">

<html>
<head>
    <title>TestNG Report</title>
    <style>
        body { font-family: Arial; }
        table { border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: center; }
        th { background-color: #4CAF50; color: white; }
        td { background-color: #f2f2f2; }
    </style>
</head>

<body>
    <h2>TestNG Results Summary</h2>

    <table border="1">
        <tr>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
        </tr>

        <tr>
            <td><xsl:value-of select="testng-results/@total"/></td>
            <td><xsl:value-of select="testng-results/@passed"/></td>
            <td><xsl:value-of select="testng-results/@failed"/></td>
            <td><xsl:value-of select="testng-results/@skipped"/></td>
        </tr>
    </table>

</body>
</html>

</xsl:template>
</xsl:stylesheet>