#!/bin/bash

echo "جارٍ إيقاف خادم مكتبة معهد الوادي..."

# إغلاق الخادم
pkill -f server.py

echo "تم إيقاف الخادم بنجاح."
sleep 2
